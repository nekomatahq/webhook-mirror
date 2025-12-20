import "./polyfill.js";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { customersCreate } from "@polar-sh/sdk/funcs/customersCreate.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";
import { customerSessionsCreate } from "@polar-sh/sdk/funcs/customerSessionsCreate.js";
import { subscriptionsUpdate } from "@polar-sh/sdk/funcs/subscriptionsUpdate.js";

import type { Checkout } from "@polar-sh/sdk/models/components/checkout.js";
import type { WebhookProductCreatedPayload } from "@polar-sh/sdk/models/components/webhookproductcreatedpayload.js";
import type { WebhookProductUpdatedPayload } from "@polar-sh/sdk/models/components/webhookproductupdatedpayload.js";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload.js";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload.js";
import {
  WebhookVerificationError,
  validateEvent,
} from "@polar-sh/sdk/webhooks";
import {
  type FunctionReference,
  type GenericActionCtx,
  type GenericDataModel,
  type HttpRouter,
  actionGeneric,
  httpActionGeneric,
  queryGeneric,
  type ApiFromModules,
} from "convex/server";
import { type Infer, v } from "convex/values";
import { mapValues } from "remeda";
import { components } from "../_generated/api.js";
import schema from "../schema.js";
import {
  type RunMutationCtx,
  type RunQueryCtx,
  convertToDatabaseProduct,
  convertToDatabaseSubscription,
  type RunActionCtx,
} from "../util.js";
import { createSafeLog, redactUserId, redactEmail, redactObject } from "../utils/logging.js";

export const subscriptionValidator = schema.tables.subscriptions.validator;
export type Subscription = Infer<typeof subscriptionValidator>;

export type SubscriptionHandler = FunctionReference<
  "mutation",
  "internal",
  { subscription: Subscription }
>;

export type PolarComponentApi = ApiFromModules<{
  checkout: ReturnType<Polar["api"]>;
}>["checkout"];

export class Polar<
  DataModel extends GenericDataModel = GenericDataModel,
  Products extends Record<string, string> = Record<string, string>,
> {
  public polar: PolarCore;
  public products: Products;
  private organizationToken: string;
  private webhookSecret: string;
  private server: "sandbox" | "production";

  constructor(
    public component: typeof components.polar,
    private config: {
      products?: Products;
      getUserInfo: (ctx: RunQueryCtx) => Promise<{
        userId: string;
        email: string;
      }>;
      organizationToken?: string;
      webhookSecret?: string;
      server?: "sandbox" | "production";
    },
  ) {
    this.products = config.products ?? ({} as Products);
    this.organizationToken =
      config.organizationToken ?? process.env["POLAR_ORGANIZATION_TOKEN"] ?? "";
    this.webhookSecret =
      config.webhookSecret ?? process.env["POLAR_WEBHOOK_SECRET"] ?? "";
    this.server =
      config.server ??
      (process.env["POLAR_SERVER"] as "sandbox" | "production") ??
      "sandbox";

    this.polar = new PolarCore({
      accessToken: this.organizationToken,
      server: this.server,
    });
    console.log("[Polar:init]", createSafeLog({
      server: this.server,
      organizationToken: this.organizationToken ? "[REDACTED]" : undefined,
      webhookSecret: this.webhookSecret ? "[REDACTED]" : undefined,
      products: this.products,
    }));
  }
  getCustomerByUserId(ctx: RunQueryCtx, userId: string) {
    console.log("[Polar:getCustomerByUserId]", { userId: redactUserId(userId) });
    return ctx.runQuery(this.component.lib.getCustomerByUserId, { userId });
  }
  async syncProducts(ctx: RunActionCtx) {
    console.log("[Polar:syncProducts]", createSafeLog({
      polarAccessToken: this.organizationToken ? "[REDACTED]" : undefined,
      server: this.server,
    }));
    await ctx.runAction(this.component.lib.syncProducts, {
      polarAccessToken: this.organizationToken,
      server: this.server,
    });
  }
  async createCheckoutSession(
    ctx: RunMutationCtx,
    {
      productIds,
      userId,
      email,
      origin,
      successUrl,
      subscriptionId,
    }: {
      productIds: string[];
      userId: string;
      email: string;
      origin: string;
      successUrl: string;
      subscriptionId?: string;
    },
  ): Promise<Checkout> {
    console.log("[Polar:createCheckoutSession:start]", createSafeLog({
      userId, email, productIds, origin, successUrl, subscriptionId,
    }));
    const dbCustomer = await ctx.runQuery(
      this.component.lib.getCustomerByUserId,
      {
        userId,
      },
    );
    const createCustomer = async () => {
      const customer = await customersCreate(this.polar, {
        customerCreate: {
          email,
          metadata: {
            userId,
          },
        },
      });
      if (!customer.value) {
        console.error("[Polar:createCheckoutSession:createCustomer:failure]", createSafeLog(customer));
        throw new Error("Customer not created");
      }
      console.log("[Polar:createCheckoutSession:createCustomer:success]", createSafeLog({ customer: customer.value }));
      return customer.value;
    };
    const customerId = dbCustomer?.id || (await createCustomer()).id;
    if (!dbCustomer) {
      await ctx.runMutation(this.component.lib.insertCustomer, {
        id: customerId,
        userId,
      });
      console.log("[Polar:createCheckoutSession:insertCustomer]", createSafeLog({ customerId, userId }));
    }
    const checkout = await checkoutsCreate(this.polar, {
      allowDiscountCodes: true,
      customerId,
      subscriptionId,
      embedOrigin: origin,
      successUrl,
      ...(productIds.length === 1
        ? { products: productIds }
        : { products: productIds }),
    });
    if (!checkout.value) {
      console.error("[Polar:createCheckoutSession:checkoutCreate:failure]", createSafeLog(checkout));
      throw new Error("Checkout not created");
    }
    console.log("[Polar:createCheckoutSession:success]", createSafeLog({ url: checkout.value.url, customerId: redactUserId(customerId) }));
    return checkout.value;
  }
  async createCustomerPortalSession(
    ctx: GenericActionCtx<DataModel>,
    { userId }: { userId: string },
  ) {
    console.log("[Polar:createCustomerPortalSession:start]", { userId: redactUserId(userId) });
    const customer = await ctx.runQuery(
      this.component.lib.getCustomerByUserId,
      { userId },
    );

    if (!customer) {
      console.error("[Polar:createCustomerPortalSession:notfound]", { userId: redactUserId(userId) });
      throw new Error("Customer not found");
    }

    const session = await customerSessionsCreate(this.polar, {
      customerId: customer.id,
    });
    if (!session.value) {
      console.error("[Polar:createCustomerPortalSession:failure]", createSafeLog(session));
      throw new Error("Customer session not created");
    }

    console.log("[Polar:createCustomerPortalSession:success]", { url: session.value.customerPortalUrl, userId: redactUserId(userId) });
    return { url: session.value.customerPortalUrl };
  }
  listProducts(
    ctx: RunQueryCtx,
    { includeArchived }: { includeArchived?: boolean } = {},
  ) {
    console.log("[Polar:listProducts]", createSafeLog({ includeArchived }));
    return ctx.runQuery(this.component.lib.listProducts, {
      includeArchived,
    });
  }
  async getCurrentSubscription(
    ctx: RunQueryCtx,
    { userId }: { userId: string },
  ) {
    console.log("[Polar:getCurrentSubscription:start]", { userId: redactUserId(userId) });
    const subscription = await ctx.runQuery(
      this.component.lib.getCurrentSubscription,
      {
        userId,
      },
    );
    if (!subscription) {
      console.log("[Polar:getCurrentSubscription:notfound]", { userId: redactUserId(userId) });
      return null;
    }
    const product = await ctx.runQuery(this.component.lib.getProduct, {
      id: subscription.productId,
    });
    if (!product) {
      console.error("[Polar:getCurrentSubscription:productNotFound]", createSafeLog({ productId: subscription.productId }));
      throw new Error("Product not found");
    }
    const productKey = (
      Object.keys(this.products) as Array<keyof Products>
    ).find((key) => this.products[key] === subscription.productId);
    console.log("[Polar:getCurrentSubscription:success]", { userId: redactUserId(userId), productKey, productId: subscription.productId });
    return {
      ...subscription,
      productKey,
      product,
    };
  }
  getProduct(ctx: RunQueryCtx, { productId }: { productId: string }) {
    console.log("[Polar:getProduct]", { productId });
    return ctx.runQuery(this.component.lib.getProduct, { id: productId });
  }
  async changeSubscription(
    ctx: GenericActionCtx<DataModel>,
    { productId }: { productId: string },
  ) {
    console.log("[Polar:changeSubscription:start]", { productId });
    const { userId } = await this.config.getUserInfo(ctx);
    const subscription = await this.getCurrentSubscription(ctx, { userId });
    if (!subscription) {
      console.error("[Polar:changeSubscription:subNotFound]", { userId: redactUserId(userId) });
      throw new Error("Subscription not found");
    }
    if (subscription.productId === productId) {
      console.warn("[Polar:changeSubscription:alreadyOnProduct]", { userId: redactUserId(userId), productId });
      throw new Error("Subscription already on this product");
    }
    const updatedSubscription = await subscriptionsUpdate(this.polar, {
      id: subscription.id,
      subscriptionUpdate: {
        productId,
      },
    });
    if (!updatedSubscription.value) {
      console.error("[Polar:changeSubscription:updateFailed]", createSafeLog(updatedSubscription));
      throw new Error("Subscription not updated");
    }
    console.log("[Polar:changeSubscription:success]", createSafeLog({ userId: redactUserId(userId), productId }));
    return updatedSubscription.value;
  }
  async cancelSubscription(
    ctx: RunActionCtx,
    { revokeImmediately }: { revokeImmediately?: boolean } = {},
  ) {
    console.log("[Polar:cancelSubscription:start]", { revokeImmediately });
    const { userId } = await this.config.getUserInfo(ctx);
    const subscription = await this.getCurrentSubscription(ctx, { userId });
    if (!subscription) {
      console.error("[Polar:cancelSubscription:subNotFound]", { userId: redactUserId(userId) });
      throw new Error("Subscription not found");
    }
    if (subscription.status !== "active") {
      console.warn("[Polar:cancelSubscription:notActive]", { subscriptionId: subscription.id, status: subscription.status });
      throw new Error("Subscription is not active");
    }
    const updatedSubscription = await subscriptionsUpdate(this.polar, {
      id: subscription.id,
      subscriptionUpdate: revokeImmediately
        ? { revoke: true }
        : { cancelAtPeriodEnd: true },
    });
    if (!updatedSubscription.value) {
      console.error("[Polar:cancelSubscription:updateFailed]", createSafeLog(updatedSubscription));
      throw new Error("Subscription not updated");
    }
    console.log("[Polar:cancelSubscription:success]", createSafeLog({ userId: redactUserId(userId), status: updatedSubscription.value.status }));
    return updatedSubscription.value;
  }
  api() {
    return {
      changeCurrentSubscription: actionGeneric({
        args: {
          productId: v.string(),
        },
        handler: async (ctx, args) => {
          console.log("[Polar:api:changeCurrentSubscription]", createSafeLog(args));
          await this.changeSubscription(ctx, {
            productId: args.productId,
          });
        },
      }),
      cancelCurrentSubscription: actionGeneric({
        args: {
          revokeImmediately: v.optional(v.boolean()),
        },
        handler: async (ctx, args) => {
          console.log("[Polar:api:cancelCurrentSubscription]", createSafeLog(args));
          await this.cancelSubscription(ctx, {
            revokeImmediately: args.revokeImmediately,
          });
        },
      }),
      getConfiguredProducts: queryGeneric({
        args: {},
        handler: async (ctx) => {
          console.log("[Polar:api:getConfiguredProducts]");
          const products = await this.listProducts(ctx);
          return mapValues(this.products, (productId) =>
            products.find((p: { id: string }) => p.id === productId),
          );
        },
      }),
      listAllProducts: queryGeneric({
        args: {},
        handler: async (ctx) => {
          console.log("[Polar:api:listAllProducts]");
          return await this.listProducts(ctx);
        },
      }),
      generateCheckoutLink: actionGeneric({
        args: {
          productIds: v.array(v.string()),
          origin: v.string(),
          successUrl: v.string(),
          subscriptionId: v.optional(v.string()),
        },
        returns: v.object({
          url: v.string(),
        }),
        handler: async (ctx, args) => {
          console.log("[Polar:api:generateCheckoutLink:start]", createSafeLog(args));
          const { userId, email } = await this.config.getUserInfo(ctx);
          const { url } = await this.createCheckoutSession(ctx, {
            productIds: args.productIds,
            userId,
            email,
            subscriptionId: args.subscriptionId,
            origin: args.origin,
            successUrl: args.successUrl,
          });
          console.log("[Polar:api:generateCheckoutLink:success]", { userId: redactUserId(userId), url });
          return { url };
        },
      }),
      generateCustomerPortalUrl: actionGeneric({
        args: {},
        returns: v.object({ url: v.string() }),
        handler: async (ctx) => {
          const { userId } = await this.config.getUserInfo(ctx);
          console.log("[Polar:api:generateCustomerPortalUrl]", { userId: redactUserId(userId) });
          const { url } = await this.createCustomerPortalSession(ctx, {
            userId,
          });
          return { url };
        },
      }),
    };
  }
  /**
   * @deprecated: use api() instead
   */
  checkoutApi() {
    return this.api();
  }
  registerRoutes(
    http: HttpRouter,
    {
      path = "/polar/events",
      onSubscriptionCreated,
      onSubscriptionUpdated,
      onProductCreated,
      onProductUpdated,
    }: {
      path?: string;
      onSubscriptionCreated?: (
        ctx: RunMutationCtx,
        event: WebhookSubscriptionCreatedPayload,
      ) => Promise<void>;
      onSubscriptionUpdated?: (
        ctx: RunMutationCtx,
        event: WebhookSubscriptionUpdatedPayload,
      ) => Promise<void>;
      onProductCreated?: (
        ctx: RunMutationCtx,
        event: WebhookProductCreatedPayload,
      ) => Promise<void>;
      onProductUpdated?: (
        ctx: RunMutationCtx,
        event: WebhookProductUpdatedPayload,
      ) => Promise<void>;
    } = {},
  ) {
    http.route({
      path,
      method: "POST",
      handler: httpActionGeneric(async (ctx, request) => {
        if (!request.body) {
          console.error("[Polar:registerRoutes:noBody]");
          throw new Error("No body");
        }
        const body = await request.text();
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log("[Polar:registerRoutes:incomingEvent]", createSafeLog({
          path, headers: headers, body: body,
        }));
        try {
          const event = validateEvent(body, headers, this.webhookSecret);
          console.log("[Polar:registerRoutes:validatedEvent]", { type: event.type });
          switch (event.type) {
            case "subscription.created": {
              console.log("[Polar:registerRoutes:subscription.created]", createSafeLog(event.data));
              await ctx.runMutation(this.component.lib.createSubscription, {
                subscription: convertToDatabaseSubscription(event.data),
              });
              await onSubscriptionCreated?.(ctx, event);
              break;
            }
            case "subscription.updated": {
              console.log("[Polar:registerRoutes:subscription.updated]", createSafeLog(event.data));
              await ctx.runMutation(this.component.lib.updateSubscription, {
                subscription: convertToDatabaseSubscription(event.data),
              });
              await onSubscriptionUpdated?.(ctx, event);
              break;
            }
            case "product.created": {
              console.log("[Polar:registerRoutes:product.created]", createSafeLog(event.data));
              await ctx.runMutation(this.component.lib.createProduct, {
                product: convertToDatabaseProduct(event.data),
              });
              await onProductCreated?.(ctx, event);
              break;
            }
            case "product.updated": {
              console.log("[Polar:registerRoutes:product.updated]", createSafeLog(event.data));
              await ctx.runMutation(this.component.lib.updateProduct, {
                product: convertToDatabaseProduct(event.data),
              });
              await onProductUpdated?.(ctx, event);
              break;
            }
          }
          return new Response("Accepted", { status: 202 });
        } catch (error) {
          if (error instanceof WebhookVerificationError) {
            console.error("[Polar:registerRoutes:WebhookVerificationError]", error.message, {
              body: "[REDACTED]",
              headers: "[REDACTED]",
            });
            return new Response("Forbidden", { status: 403 });
          }
          console.error("[Polar:registerRoutes:Error]", error instanceof Error ? error.message : error, {
            body: "[REDACTED]",
            headers: "[REDACTED]",
          });
          throw error;
        }
      }),
    });
  }
}
