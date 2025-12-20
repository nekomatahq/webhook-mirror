import { Polar } from "./polar_client";
import { api, components } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { redactEmail, redactUserId } from "./utils/logging";

export const polar = new Polar(components.polar, {
    products: {
        premiumMonthly: process.env.POLAR_PREMIUM_MONTHLY_PRODUCT_ID!,
    },
    getUserInfo: async (ctx) => {
        // Use runQuery to get the current authenticated user
        // This query handles authentication internally via getAuthUserId
        const user = await ctx.runQuery(api.users.query.getMe);

        if (!user) {
            console.error("[POLAR] getUserInfo - no user found");
            throw new Error("User not authenticated");
        }

        if (!user.email) {
            console.error("[POLAR] getUserInfo - user has no email");
            throw new Error("User email is required for billing");
        }

        const userInfo: { userId: string; email: string } = {
            userId: user._id,
            email: user.email,
        };

        console.log("[POLAR] getUserInfo", {
            userId: redactUserId(userInfo.userId),
            email: redactEmail(userInfo.email),
        });

        return userInfo;
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