import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../model/users";
import { internal } from "../_generated/api";

export const getSubscriptionStatus = query({
  args: {},
  returns: v.object({
    hasActiveSubscription: v.boolean(),
  }),
  handler: async (ctx): Promise<{ hasActiveSubscription: boolean }> => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        hasActiveSubscription: false,
      };
    }

    try {
      const subscription: {
        status: string;
      } | null = await ctx.runQuery(
        internal.polar.getCurrentSubscription,
        { userId: user._id }
      );
      return {
        hasActiveSubscription: subscription !== null && subscription.status === "active",
      };
    } catch (error) {
      console.error("Error getting subscription status:", error);
      return {
        hasActiveSubscription: false,
      };
    }
  },
});
