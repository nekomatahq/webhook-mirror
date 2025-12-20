import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../model/users";
import { internal } from "../_generated/api";
import { redactUserId, redactEmail } from "../utils/logging";

export const getSubscriptionStatus = query({
  args: {},
  returns: v.object({
    hasActiveSubscription: v.boolean(),
  }),
  handler: async (ctx): Promise<{ hasActiveSubscription: boolean }> => {
    console.log("[SUBSCRIPTION] getSubscriptionStatus - starting");

    const user = await getCurrentUser(ctx);
    if (!user) {
      console.log("[SUBSCRIPTION] getSubscriptionStatus - no user");
      return {
        hasActiveSubscription: false,
      };
    }

    console.log("[SUBSCRIPTION] getSubscriptionStatus", {
      userId: redactUserId(user._id),
      email: redactEmail(user.email),
    });

    try {
      const subscription: {
        status: string;
      } | null = await ctx.runQuery(
        internal.polar.getCurrentSubscription,
        { userId: user._id }
      );
      
      // Consider both "active" and "trialing" as active subscriptions
      const hasActiveSubscription = subscription !== null && 
        (subscription.status === "active" || subscription.status === "trialing");
      
      console.log("[SUBSCRIPTION] getSubscriptionStatus - result", {
        userId: redactUserId(user._id),
        hasActiveSubscription,
        status: subscription?.status || null,
      });

      return {
        hasActiveSubscription,
      };
    } catch (error) {
      console.error("[SUBSCRIPTION] getSubscriptionStatus - error", {
        userId: redactUserId(user._id),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        hasActiveSubscription: false,
      };
    }
  },
});
