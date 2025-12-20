import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { redactEmail, redactUserId, createSafeLog } from "./utils/logging";

export const polar = new Polar(components.polar, {
  // Required: provide a function the component can use to get the current user's ID and
  // email - this will be used for retrieving the correct subscription data for the
  // current user. The function should return an object with `userId` and `email`
  // properties.
  // This is used to automatically create customers in Polar when users sign up.
  // The context provided by Polar supports runQuery, so we use that to get the authenticated user.
  getUserInfo: async (ctx) => {
    // Use runQuery to get the current authenticated user
    // This query handles authentication internally via getAuthUserId
    const user = await ctx.runQuery(api.users.query.getMe) as { _id: string; email: string | null } | null;
    
    if (!user) {
      console.log("[POLAR] getUserInfo - no user found");
      return { userId: "", email: "" };
    }

    const userInfo = {
      userId: user._id,
      email: user.email ?? "",
    };

    console.log("[POLAR] getUserInfo", {
      userId: redactUserId(userInfo.userId),
      email: redactEmail(userInfo.email),
    });

    return userInfo;
  },
  products: {
    premiumMonthly: process.env.POLAR_PREMIUM_MONTHLY_PRODUCT_ID ?? "",
  },
});

export const syncProducts = action({
    args: {},
    handler: async (ctx) => {
      console.log("[POLAR] syncProducts - starting");
      try {
        await polar.syncProducts(ctx);
        console.log("[POLAR] syncProducts - completed successfully");
      } catch (error) {
        console.error("[POLAR] syncProducts - error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
});

// Export API functions from the Polar client
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();

// Internal query to get current subscription for a user
export const getCurrentSubscription = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log("[POLAR] getCurrentSubscription", {
      userId: redactUserId(args.userId),
    });
    try {
      const subscription = await polar.getCurrentSubscription(ctx, {
        userId: args.userId,
      });
      console.log("[POLAR] getCurrentSubscription - result", {
        userId: redactUserId(args.userId),
        hasSubscription: subscription !== null,
        status: subscription?.status || null,
      });
      return subscription;
    } catch (error) {
      console.error("[POLAR] getCurrentSubscription - error", {
        userId: redactUserId(args.userId),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});