import "./polyfill.js";
import { PolarCore } from "@polar-sh/sdk/core.js";
import { customersCreate } from "@polar-sh/sdk/funcs/customersCreate.js";
import { customersGet } from "@polar-sh/sdk/funcs/customersGet.js";
import { customersList } from "@polar-sh/sdk/funcs/customersList.js";
import { checkoutsCreate } from "@polar-sh/sdk/funcs/checkoutsCreate.js";
import { customerSessionsCreate } from "@polar-sh/sdk/funcs/customerSessionsCreate.js";
import { subscriptionsUpdate } from "@polar-sh/sdk/funcs/subscriptionsUpdate.js";

import type { Checkout } from "@polar-sh/sdk/models/components/checkout.js";
import type { Customer } from "@polar-sh/sdk/models/components/customer.js";
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
  private mainApi: any = null;
  private mainInternal: any = null;

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
      mainApi?: any;
      mainInternal?: any;
    },
  ) {
    if (config.mainApi) {
      this.mainApi = config.mainApi;
    }
    if (config.mainInternal) {
      this.mainInternal = config.mainInternal;
    }
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

  // ============================================================================
  // Private helper methods for customer management
  // ============================================================================

  /**
   * Query local database for a customer by userId.
   */
  private async queryCustomerByUserId(
    ctx: RunQueryCtx,
    userId: string
  ): Promise<{ id: string; userId: string; metadata?: Record<string, any> } | null> {
    console.log("[Polar:queryCustomerByUserId]", { userId: redactUserId(userId) });
    if (this.mainApi) {
      return ctx.runQuery(this.mainApi.getCustomerByUserId, { userId });
    }
    return ctx.runQuery(this.component.lib.getCustomerByUserId, { userId });
  }

  /**
   * Insert a new customer into the local database.
   */
  private async insertCustomerToDb(
    ctx: RunMutationCtx,
    customer: { id: string; userId: string; metadata?: Record<string, any> }
  ): Promise<void> {
    console.log("[Polar:insertCustomerToDb]", { 
      customerId: customer.id, 
      userId: redactUserId(customer.userId) 
    });
    if (this.mainApi) {
      await ctx.runMutation(this.mainApi.insertCustomer, {
        id: customer.id,
        userId: customer.userId,
        metadata: customer.metadata,
      });
    } else {
      await ctx.runMutation(this.component.lib.insertCustomer, {
        id: customer.id,
        userId: customer.userId,
        metadata: customer.metadata,
      });
    }
  }

  /**
   * Find an existing customer in Polar by their email address.
   * Uses the customersList API with exact email filter.
   */
  private async findPolarCustomerByEmail(email: string): Promise<Customer | null> {
    console.log("[Polar:findPolarCustomerByEmail]", { email: redactEmail(email) });
    
    const result = await customersList(this.polar, { email, limit: 1 });
    
    // Handle pagination iterator - get first page
    const firstPage = await result;
    if (!firstPage.value) {
      console.log("[Polar:findPolarCustomerByEmail:error]", createSafeLog(firstPage));
      return null;
    }
    
    const customers = firstPage.value.result.items;
    if (customers.length === 0) {
      console.log("[Polar:findPolarCustomerByEmail:notFound]", { email: redactEmail(email) });
      return null;
    }
    
    const customer = customers[0];
    console.log("[Polar:findPolarCustomerByEmail:found]", { 
      customerId: customer.id, 
      email: redactEmail(customer.email) 
    });
    return customer;
  }

  /**
   * Create a new customer in Polar.
   */
  private async createPolarCustomer(data: { 
    email: string; 
    userId: string 
  }): Promise<Customer> {
    console.log("[Polar:createPolarCustomer]", { 
      email: redactEmail(data.email), 
      userId: redactUserId(data.userId) 
    });

    const result = await customersCreate(this.polar, {
      email: data.email,
      metadata: {
        userId: data.userId,
      },
    });

    if (!result.value) {
      console.error("[Polar:createPolarCustomer:failure]", createSafeLog(result));
      throw new Error("Failed to create customer in Polar");
    }
    
    console.log("[Polar:createPolarCustomer:success]", { 
      customerId: result.value.id 
    });
    return result.value;
  }

  /**
   * Verify a customer exists in Polar by their ID.
   * Returns the customer if found, null if not found or deleted.
   */
  private async verifyPolarCustomerExists(customerId: string): Promise<Customer | null> {
    console.log("[Polar:verifyPolarCustomerExists]", { customerId });
    
    const result = await customersGet(this.polar, { id: customerId });
    
    if (!result.value) {
      // Customer doesn't exist in Polar (deleted or never synced)
      console.log("[Polar:verifyPolarCustomerExists:notFound]", { customerId });
      return null;
    }
    
    // Check if customer was soft-deleted
    if (result.value.deletedAt) {
      console.log("[Polar:verifyPolarCustomerExists:deleted]", { 
        customerId, 
        deletedAt: result.value.deletedAt 
      });
      return null;
    }
    
    console.log("[Polar:verifyPolarCustomerExists:found]", { 
      customerId, 
      email: redactEmail(result.value.email) 
    });
    return result.value;
  }

  /**
   * Update an existing customer record in the local database.
   */
  private async updateCustomerInDb(
    ctx: RunMutationCtx,
    { id, userId, metadata }: { id: string; userId: string; metadata?: Record<string, any> }
  ): Promise<void> {
    console.log("[Polar:updateCustomerInDb]", { 
      customerId: id, 
      userId: redactUserId(userId) 
    });
    if (this.mainApi) {
      await ctx.runMutation(this.mainApi.upsertCustomer, {
        id,
        userId,
        metadata: metadata ?? {},
      });
    } else {
      await ctx.runMutation(this.component.lib.upsertCustomer, {
        id,
        userId,
        metadata: metadata ?? {},
      });
    }
  }

  /**
   * Get or create a Polar customer, ensuring the local DB is in sync.
   * 
   * Flow:
   * 1. Check if customer exists in local DB by userId
   * 2. If found in DB, verify it exists in Polar (handle stale records)
   * 3. If not in DB or stale, search Polar by email to find existing customer
   * 4. If found in Polar, sync to local DB
   * 5. If not found anywhere, create new customer in Polar and sync to local DB
   */
  private async getOrCreatePolarCustomer(
    ctx: RunMutationCtx,
    { userId, email }: { userId: string; email: string }
  ): Promise<{ customerId: string; wasCreated: boolean }> {
    console.log("[Polar:getOrCreatePolarCustomer:start]", { 
      userId: redactUserId(userId), 
      email: redactEmail(email) 
    });

    // Step 1: Check local DB first
    const dbCustomer = await this.queryCustomerByUserId(ctx, userId);
    
    if (dbCustomer) {
      // Step 2: Verify the customer actually exists in Polar (handle stale DB records)
      const polarCustomer = await this.verifyPolarCustomerExists(dbCustomer.id);
      
      if (polarCustomer) {
        console.log("[Polar:getOrCreatePolarCustomer:verifiedInPolar]", { 
          customerId: dbCustomer.id 
        });
        return { customerId: dbCustomer.id, wasCreated: false };
      }
      
      // Customer in DB but not in Polar - need to find/create and update DB
      console.log("[Polar:getOrCreatePolarCustomer:staleDbRecord]", { 
        staleCustomerId: dbCustomer.id 
      });
    }

    // Step 3: Search Polar by exact email (customer not in DB, or DB record is stale)
    const existingPolarCustomer = await this.findPolarCustomerByEmail(email);
    
    if (existingPolarCustomer) {
      // Found in Polar - sync to local DB (insert or update)
      console.log("[Polar:getOrCreatePolarCustomer:foundInPolar]", { 
        customerId: existingPolarCustomer.id 
      });
      
      if (dbCustomer) {
        // Update existing DB record with correct Polar ID
        await this.updateCustomerInDb(ctx, { 
          id: existingPolarCustomer.id, 
          userId,
          metadata: existingPolarCustomer.metadata as Record<string, any>,
        });
      } else {
        // Insert new record
        await this.insertCustomerToDb(ctx, { 
          id: existingPolarCustomer.id, 
          userId,
          metadata: existingPolarCustomer.metadata as Record<string, any>,
        });
      }
      return { customerId: existingPolarCustomer.id, wasCreated: false };
    }

    // Step 4: Create new customer in Polar
    console.log("[Polar:getOrCreatePolarCustomer:creating]");
    const newCustomer = await this.createPolarCustomer({ email, userId });
    
    if (dbCustomer) {
      // Update existing DB record with new Polar customer ID
      await this.updateCustomerInDb(ctx, { 
        id: newCustomer.id, 
        userId,
        metadata: newCustomer.metadata as Record<string, any>,
      });
    } else {
      // Insert new record
      await this.insertCustomerToDb(ctx, { 
        id: newCustomer.id, 
        userId,
        metadata: newCustomer.metadata as Record<string, any>,
      });
    }
    
    console.log("[Polar:getOrCreatePolarCustomer:created]", { 
      customerId: newCustomer.id 
    });
    return { customerId: newCustomer.id, wasCreated: true };
  }

  // ============================================================================
  // Public methods
  // ============================================================================

  getCustomerByUserId(ctx: RunQueryCtx, userId: string) {
    console.log("[Polar:getCustomerByUserId]", { userId: redactUserId(userId) });
    // Use main app's API if available, otherwise fall back to component API
    if (this.mainApi) {
      return ctx.runQuery(this.mainApi.getCustomerByUserId, { userId });
    }
    return ctx.runQuery(this.component.lib.getCustomerByUserId, { userId });
  }
  async syncProducts(ctx: RunActionCtx) {
    console.log("[Polar:syncProducts]", createSafeLog({
      polarAccessToken: this.organizationToken ? "[REDACTED]" : undefined,
      server: this.server,
    }));
    // Use main app's API if available, otherwise fall back to component API
    if (this.mainApi) {
      await ctx.runAction(this.mainApi.syncProducts, {
        polarAccessToken: this.organizationToken,
        server: this.server,
      });
    } else {
      await ctx.runAction(this.component.lib.syncProducts, {
        polarAccessToken: this.organizationToken,
        server: this.server,
      });
    }
  }
  /**
   * Create a checkout session for a user.
   * 
   * This method ensures:
   * 1. The customer exists in Polar (creating or finding by email if needed)
   * 2. The local DB is in sync with Polar
   * 3. Email is immutable (embedded via customerId, not passed directly)
   */
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
      userId: redactUserId(userId), 
      email: redactEmail(email), 
      productIds, 
      origin, 
      successUrl, 
      subscriptionId,
    }));
    
    // Validate email is provided
    if (!email?.trim()) {
      throw new Error("Email is required for checkout creation");
    }

    // Get or create customer (handles all edge cases: in DB, in Polar, or new)
    const { customerId } = await this.getOrCreatePolarCustomer(ctx, { userId, email });

    // Create checkout with customerId - email is immutable via customer record
    const checkout = await checkoutsCreate(this.polar, {
      allowDiscountCodes: false,
      customerId,
      subscriptionId,
      embedOrigin: origin,
      successUrl,
      products: productIds,
    });

    if (!checkout.value) {
      console.error("[Polar:createCheckoutSession:failure]", createSafeLog(checkout));
      throw new Error("Checkout not created");
    }

    console.log("[Polar:createCheckoutSession:success]", { 
      url: checkout.value.url, 
      customerId 
    });
    return checkout.value;
  }
  async createCustomerPortalSession(
    ctx: GenericActionCtx<DataModel>,
    { userId }: { userId: string },
  ) {
    console.log("[Polar:createCustomerPortalSession:start]", { userId: redactUserId(userId) });
    // Use main app's API if available, otherwise fall back to component API
    const customer = this.mainApi
      ? await ctx.runQuery(this.mainApi.getCustomerByUserId, { userId })
      : await ctx.runQuery(this.component.lib.getCustomerByUserId, { userId });

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
    // Use main app's API if available, otherwise fall back to component API
    if (this.mainApi) {
      return ctx.runQuery(this.mainApi.listProducts, {
        includeArchived,
      });
    }
    return ctx.runQuery(this.component.lib.listProducts, {
      includeArchived,
    });
  }
  async getCurrentSubscription(
    ctx: RunQueryCtx,
    { userId }: { userId: string },
  ) {
    console.log("[Polar:getCurrentSubscription:start]", { userId: redactUserId(userId) });
    // Use main app's API if available, otherwise fall back to component API
    const subscription = this.mainApi
      ? await ctx.runQuery(this.mainApi.getCurrentSubscription, { userId })
      : await ctx.runQuery(this.component.lib.getCurrentSubscription, { userId });
    if (!subscription) {
      console.log("[Polar:getCurrentSubscription:notfound]", { userId: redactUserId(userId) });
      return null;
    }
    const product = this.mainApi
      ? await ctx.runQuery(this.mainApi.getProduct, { id: subscription.productId })
      : await ctx.runQuery(this.component.lib.getProduct, { id: subscription.productId });
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
    // Use main app's API if available, otherwise fall back to component API
    if (this.mainApi) {
      return ctx.runQuery(this.mainApi.getProduct, { id: productId });
    }
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
          console.log("[Polar:api:getConfiguredProducts] - fetching configured products");
          // Include archived products since configured products might be archived
          const products = await this.listProducts(ctx, { includeArchived: true });
          const mapped = mapValues(this.products, (productId, key) => {
            const product = products.find((p: { id: string }) => p.id === productId);
            if (!product) {
              console.warn(`[Polar:api:getConfiguredProducts] - Product not found for key '${key}' with id '${productId}'`, {
                searchedProductId: productId,
                availableProductIds: products.map((p: { id: string }) => p.id),
                totalProducts: products.length,
              });
            } else {
              console.log(`[Polar:api:getConfiguredProducts] - Found product for key '${key}'`, { productId, productName: product.name });
            }
            return {
              id: productId,
              product: product ?? null,
            };
          });
          console.log("[Polar:api:getConfiguredProducts] - result", {
            keys: Object.keys(mapped),
            missing: Object.keys(mapped).filter(k => !mapped[k]?.product)
          });
          return mapped;
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
              // Use main app's API if available, otherwise fall back to component API
              if (this.mainApi) {
                await ctx.runMutation(this.mainApi.createSubscription, {
                  subscription: convertToDatabaseSubscription(event.data),
                });
              } else {
                await ctx.runMutation(this.component.lib.createSubscription, {
                  subscription: convertToDatabaseSubscription(event.data),
                });
              }
              await onSubscriptionCreated?.(ctx, event);
              break;
            }
            case "subscription.updated": {
              console.log("[Polar:registerRoutes:subscription.updated]", createSafeLog(event.data));
              // Use main app's API if available, otherwise fall back to component API
              if (this.mainApi) {
                await ctx.runMutation(this.mainApi.updateSubscription, {
                  subscription: convertToDatabaseSubscription(event.data),
                });
              } else {
                await ctx.runMutation(this.component.lib.updateSubscription, {
                  subscription: convertToDatabaseSubscription(event.data),
                });
              }
              await onSubscriptionUpdated?.(ctx, event);
              break;
            }
            case "product.created": {
              console.log("[Polar:registerRoutes:product.created]", createSafeLog(event.data));
              // Use main app's API if available, otherwise fall back to component API
              if (this.mainApi) {
                await ctx.runMutation(this.mainApi.createProduct, {
                  product: convertToDatabaseProduct(event.data),
                });
              } else {
                await ctx.runMutation(this.component.lib.createProduct, {
                  product: convertToDatabaseProduct(event.data),
                });
              }
              await onProductCreated?.(ctx, event);
              break;
            }
            case "product.updated": {
              console.log("[Polar:registerRoutes:product.updated]", createSafeLog(event.data));
              // Use main app's API if available, otherwise fall back to component API
              if (this.mainApi) {
                await ctx.runMutation(this.mainApi.updateProduct, {
                  product: convertToDatabaseProduct(event.data),
                });
              } else {
                await ctx.runMutation(this.component.lib.updateProduct, {
                  product: convertToDatabaseProduct(event.data),
                });
              }
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
