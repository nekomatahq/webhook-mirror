import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { getCurrentUser } from "../model/users";
import { getAuthUserId } from "@convex-dev/auth/server";
import { redactUserId } from "./logging";
import { Id } from "../_generated/dataModel";

/**
 * Checks if a subscription status is considered active.
 * Active statuses include "active" and "trialing".
 */
function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Checks if the current user has an active subscription.
 * Returns false if user is not authenticated or has no active subscription.
 */
export async function checkSubscriptionStatus(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<boolean> {
  let userId: Id<"users"> | null;
  
  // Use getCurrentUser for queries (has db access), getAuthUserId for mutations/actions
  if ("db" in ctx) {
    const user = await getCurrentUser(ctx as QueryCtx);
    if (!user) {
      return false;
    }
    userId = user._id;
  } else {
    userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }
  }

  try {
    const subscription = await ctx.runQuery(
      internal.polar.getCurrentSubscription,
      { userId }
    );

    const hasActiveSubscription =
      subscription !== null && isActiveSubscriptionStatus(subscription.status);

    console.log("[SUBSCRIPTION] checkSubscriptionStatus", {
      userId: redactUserId(userId),
      hasActiveSubscription,
      status: subscription?.status || null,
    });

    return hasActiveSubscription;
  } catch (error) {
    console.error("[SUBSCRIPTION] checkSubscriptionStatus - error", {
      userId: redactUserId(userId),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Default to false on error - fail closed for security
    return false;
  }
}

/**
 * Checks if a specific user (by userId) has an active subscription.
 * Used when checking subscription status for endpoint owners.
 */
export async function checkUserSubscriptionStatus(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  userId: Id<"users">
): Promise<boolean> {
  try {
    const subscription = await ctx.runQuery(
      internal.polar.getCurrentSubscription,
      { userId }
    );

    const hasActiveSubscription =
      subscription !== null && isActiveSubscriptionStatus(subscription.status);

    console.log("[SUBSCRIPTION] checkUserSubscriptionStatus", {
      userId: redactUserId(userId),
      hasActiveSubscription,
      status: subscription?.status || null,
    });

    return hasActiveSubscription;
  } catch (error) {
    console.error("[SUBSCRIPTION] checkUserSubscriptionStatus - error", {
      userId: redactUserId(userId),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Default to false on error - fail closed for security
    return false;
  }
}

