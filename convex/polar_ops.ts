import { PolarCore } from "@polar-sh/sdk/core.js";
import { productsList } from "@polar-sh/sdk/funcs/productsList.js";

import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server.js";
import schema from "./schema.js";
import { asyncMap } from "convex-helpers";
import { api, components, internal } from "./_generated/api.js";
import { convertToDatabaseProduct } from "./util";
import { createSafeLog, redactObject } from "./utils/logging.js";

export const getCustomerByUserId = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(schema.tables.customers.validator, v.null()),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    return omitSystemFields(customer);
  },
});

export const insertCustomer = mutation({
  args: schema.tables.customers.validator,
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existingCustomer) {
      throw new Error(`Customer already exists for user: ${args.userId}`);
    }
    return ctx.db.insert("customers", {
      id: args.id,
      userId: args.userId,
      metadata: args.metadata,
    });
  },
});

export const upsertCustomer = mutation({
  args: schema.tables.customers.validator,
  returns: v.string(),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!customer) {
      const customerId = await ctx.db.insert("customers", {
        id: args.id,
        userId: args.userId,
        metadata: args.metadata,
      });
      const newCustomer = await ctx.db.get(customerId);
      if (!newCustomer) {
        throw new Error("Failed to create customer");
      }
      return newCustomer.id;
    }
    return customer.id;
  },
});

export const getSubscription = query({
  args: {
    id: v.string(),
  },
  returns: v.union(schema.tables.subscriptions.validator, v.null()),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("id", (q) => q.eq("id", args.id))
      .unique();
    return omitSystemFields(subscription);
  },
});

export const getProduct = query({
  args: {
    id: v.string(),
  },
  returns: v.union(schema.tables.products.validator, v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.id))
      .unique();
    return omitSystemFields(product);
  },
});

// For apps that have 0 or 1 active subscription per user.
export const getCurrentSubscription = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      ...schema.tables.subscriptions.validator.fields,
      product: schema.tables.products.validator,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!customer) {
      return null;
    }
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("customerId_endedAt", (q) =>
        q.eq("customerId", customer.id).eq("endedAt", null),
      )
      .unique();
    if (!subscription) {
      return null;
    }
    const product = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", subscription.productId))
      .unique();
    if (!product) {
      throw new Error(`Product not found: ${subscription.productId}`);
    }
    return {
      ...omitSystemFields(subscription),
      product: omitSystemFields(product),
    };
  },
});

export const listUserSubscriptions = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      ...schema.tables.subscriptions.validator.fields,
      product: v.union(schema.tables.products.validator, v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!customer) {
      return [];
    }
    const subscriptions = await asyncMap(
      ctx.db
        .query("subscriptions")
        .withIndex("customerId", (q) => q.eq("customerId", customer.id))
        .collect(),
      async (subscription) => {
        if (
          subscription.endedAt &&
          subscription.endedAt <= new Date().toISOString()
        ) {
          return;
        }
        const product = subscription.productId
          ? (await ctx.db
              .query("products")
              .withIndex("id", (q) => q.eq("id", subscription.productId))
              .unique()) || null
          : null;
        return {
          ...omitSystemFields(subscription),
          product: omitSystemFields(product),
        };
      },
    );
    return subscriptions.flatMap((subscription) =>
      subscription ? [subscription] : [],
    );
  },
});

export const listProducts = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      ...schema.tables.products.validator.fields,
      priceAmount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const q = ctx.db.query("products");
    const products = args.includeArchived
      ? await q.collect()
      : await q
          .withIndex("isArchived", (q) => q.lt("isArchived", true))
          .collect();
    return products.map((product) => omitSystemFields(product));
  },
});

export const createSubscription = mutation({
  args: {
    subscription: schema.tables.subscriptions.validator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("id", (q) => q.eq("id", args.subscription.id))
      .unique();
    if (existingSubscription) {
      throw new Error(`Subscription already exists: ${args.subscription.id}`);
    }
    await ctx.db.insert("subscriptions", {
      ...args.subscription,
      metadata: args.subscription.metadata,
    });
  },
});

export const updateSubscription = mutation({
  args: {
    subscription: schema.tables.subscriptions.validator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("id", (q) => q.eq("id", args.subscription.id))
      .unique();
    if (!existingSubscription) {
      throw new Error(`Subscription not found: ${args.subscription.id}`);
    }
    await ctx.db.patch(existingSubscription._id, {
      ...args.subscription,
      metadata: args.subscription.metadata,
    });
  },
});

export const createProduct = mutation({
  args: {
    product: schema.tables.products.validator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.product.id))
      .unique();
    if (existingProduct) {
      throw new Error(`Product already exists: ${args.product.id}`);
    }
    await ctx.db.insert("products", {
      ...args.product,
      metadata: args.product.metadata,
    });
  },
});

export const updateProduct = mutation({
  args: {
    product: schema.tables.products.validator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("id", (q) => q.eq("id", args.product.id))
      .unique();
    if (!existingProduct) {
      throw new Error(`Product not found: ${args.product.id}`);
    }
    await ctx.db.patch(existingProduct._id, {
      ...args.product,
      metadata: args.product.metadata,
    });
  },
});

export const listCustomerSubscriptions = query({
  args: {
    customerId: v.string(),
  },
  returns: v.array(schema.tables.subscriptions.validator),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("customerId", (q) => q.eq("customerId", args.customerId))
      .collect();
    return subscriptions.map(omitSystemFields);
  },
});

export const syncProducts = action({
  args: {
    polarAccessToken: v.string(),
    server: v.union(v.literal("sandbox"), v.literal("production")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const safeLog = createSafeLog({
      server: args.server,
      polarAccessToken: args.polarAccessToken,
    });
    console.log("[syncProducts] Starting product sync", safeLog);

    try {
      const polar = new PolarCore({
        accessToken: args.polarAccessToken,
        server: args.server,
      });
      let page = 1;
      let maxPage;
      let totalProducts = 0;

      do {
        console.log("[syncProducts] Fetching products page", createSafeLog({ page, server: args.server }));
        
        const products = await productsList(polar, {
          page,
          limit: 100,
        });
        
        if (!products.value) {
          console.error("[syncProducts] Failed to get products", createSafeLog({ page, server: args.server }));
          throw new Error("Failed to get products");
        }

        const productCount = products.value.result.items.length;
        maxPage = products.value.result.pagination.maxPage;
        totalProducts += productCount;

        console.log("[syncProducts] Processing products page", createSafeLog({
          page,
          maxPage,
          productCount,
          totalProducts,
          server: args.server,
        }));

        try {
          await ctx.runMutation(internal.polar_ops.updateProducts, {
            polarAccessToken: args.polarAccessToken,
            products: products.value.result.items.map(convertToDatabaseProduct),
          });
          console.log("[syncProducts] Successfully updated products for page", createSafeLog({
            page,
            productCount,
            server: args.server,
          }));
        } catch (error) {
          console.error("[syncProducts] Error updating products", createSafeLog({
            page,
            productCount,
            server: args.server,
            error: error instanceof Error ? error.message : String(error),
          }));
          throw error;
        }

        page = page + 1;
      } while (maxPage >= page);

      console.log("[syncProducts] Completed product sync", createSafeLog({
        totalProducts,
        totalPages: maxPage,
        server: args.server,
      }));
    } catch (error) {
      console.error("[syncProducts] Error during product sync", createSafeLog({
        server: args.server,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }));
      throw error;
    }
  },
});

export const updateProducts = internalMutation({
  args: {
    polarAccessToken: v.string(),
    products: v.array(schema.tables.products.validator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const safeLog = createSafeLog({
      polarAccessToken: args.polarAccessToken,
      productCount: args.products.length,
    });
    console.log("[updateProducts] Starting product update", safeLog);

    try {
      let updatedCount = 0;
      let createdCount = 0;
      const errors: Array<{ productId: string; error: string }> = [];

      await asyncMap(args.products, async (product) => {
        try {
          const existingProduct = await ctx.db
            .query("products")
            .withIndex("id", (q) => q.eq("id", product.id))
            .unique();
          
          if (existingProduct) {
            await ctx.db.patch(existingProduct._id, product);
            updatedCount++;
            console.log("[updateProducts] Updated product", createSafeLog({
              productId: product.id,
              productName: product.name,
            }));
          } else {
            await ctx.db.insert("products", product);
            createdCount++;
            console.log("[updateProducts] Created product", createSafeLog({
              productId: product.id,
              productName: product.name,
            }));
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push({ productId: product.id, error: errorMsg });
          console.error("[updateProducts] Error processing product", createSafeLog({
            productId: product.id,
            productName: product.name,
            error: errorMsg,
          }));
        }
      });

      console.log("[updateProducts] Completed product update", createSafeLog({
        totalProducts: args.products.length,
        updatedCount,
        createdCount,
        errorCount: errors.length,
      }));

      if (errors.length > 0) {
        console.error("[updateProducts] Some products failed to update", createSafeLog({
          errors: redactObject(errors),
        }));
      }
    } catch (error) {
      console.error("[updateProducts] Error during product update", createSafeLog({
        productCount: args.products.length,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }));
      throw error;
    }
  },
});

export const omitSystemFields = <
  T extends { _id: string; _creationTime: number } | null | undefined,
>(
  doc: T,
) => {
  if (!doc) {
    return doc;
  }
  const { _id, _creationTime, ...rest } = doc;
  return rest;
};
