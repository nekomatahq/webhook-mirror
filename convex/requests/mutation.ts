import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { redactHeaders, redactBody, createSafeLog } from "../utils/logging";
import { checkUserSubscriptionStatus } from "../utils/subscription";
import { FREE_REQUEST_LIMIT_REACHED } from "../utils/errors";

export const createRequest = mutation({
  args: {
    endpointId: v.id("endpoints"),
    method: v.string(),
    headers: v.record(v.string(), v.string()),
    body: v.union(v.string(), v.null()),
    bodySize: v.number(),
    timestamp: v.number(),
  },
  returns: v.object({
    _id: v.id("requests"),
  }),
  handler: async (ctx, args) => {
    console.log("[REQUESTS] createRequest", {
      endpointId: args.endpointId,
      method: args.method,
      bodySize: args.bodySize,
      timestamp: args.timestamp,
    });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint) {
      console.log("[REQUESTS] createRequest - endpoint not found", {
        endpointId: args.endpointId,
      });
      throw new Error("Endpoint not found");
    }

    if (!endpoint.active) {
      console.log("[REQUESTS] createRequest - endpoint inactive", {
        endpointId: args.endpointId,
        slug: endpoint.slug,
      });
      throw new Error("Endpoint is inactive");
    }

    // Check subscription status for endpoint owner to enforce free tier limits
    const hasActiveSubscription = await checkUserSubscriptionStatus(
      ctx,
      endpoint.userId
    );

    if (!hasActiveSubscription) {
      // For free users, enforce 5 request limit per endpoint
      const allRequests = await ctx.db.query("requests").collect();
      const endpointRequests = allRequests.filter(
        (r) => r.endpointId === args.endpointId
      );

      if (endpointRequests.length >= 5) {
        console.log("[REQUESTS] createRequest - free tier limit reached", {
          endpointId: args.endpointId,
          currentCount: endpointRequests.length,
        });
        throw new ConvexError(
          `Free tier includes 5 captured requests per endpoint. Upgrade to unlock unlimited requests. Error code: ${FREE_REQUEST_LIMIT_REACHED}`
        );
      }
    }

    const requestId = await ctx.db.insert("requests", {
      endpointId: args.endpointId,
      method: args.method,
      headers: args.headers,
      body: args.body,
      bodySize: args.bodySize,
      timestamp: args.timestamp,
    });

    const safeLog = createSafeLog({
      requestId,
      endpointId: args.endpointId,
      method: args.method,
      headers: args.headers,
      body: args.body,
      bodySize: args.bodySize,
    });

    console.log("[REQUESTS] createRequest - created", safeLog);

    return { _id: requestId };
  },
});
