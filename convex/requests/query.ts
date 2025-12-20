import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { redactUserId } from "../utils/logging";
import { checkUserSubscriptionStatus } from "../utils/subscription";

export const listRequests = query({
  args: {
    endpointId: v.id("endpoints"),
  },
  returns: v.array(
    v.object({
      _id: v.id("requests"),
      _creationTime: v.number(),
      endpointId: v.id("endpoints"),
      method: v.string(),
      headers: v.record(v.string(), v.string()),
      body: v.union(v.string(), v.null()),
      bodySize: v.number(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[REQUESTS] listRequests - unauthorized", {
        endpointId: args.endpointId,
      });
      throw new Error("Unauthorized");
    }

    console.log("[REQUESTS] listRequests", {
      endpointId: args.endpointId,
      userId: redactUserId(userId),
    });

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint) {
      console.log("[REQUESTS] listRequests - endpoint not found", {
        endpointId: args.endpointId,
        userId: redactUserId(userId),
      });
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      console.log("[REQUESTS] listRequests - unauthorized access", {
        endpointId: args.endpointId,
        userId: redactUserId(userId),
        endpointUserId: redactUserId(endpoint.userId),
      });
      throw new Error("Unauthorized");
    }

    // Check subscription status for endpoint owner to enforce free tier limits
    const hasActiveSubscription = await checkUserSubscriptionStatus(
      ctx,
      endpoint.userId
    );

    const allRequests = await ctx.db.query("requests").collect();
    const filtered = allRequests.filter((r) => r.endpointId === args.endpointId);
    let requests = filtered.sort((a, b) => b._creationTime - a._creationTime);

    // Limit to 5 most recent requests for free users
    if (!hasActiveSubscription) {
      requests = requests.slice(0, 5);
    }

    console.log("[REQUESTS] listRequests - result", {
      endpointId: args.endpointId,
      userId: redactUserId(userId),
      count: requests.length,
      hasActiveSubscription,
    });

    return requests;
  },
});

export const getRequest = query({
  args: {
    id: v.id("requests"),
  },
  returns: v.union(
    v.object({
      _id: v.id("requests"),
      _creationTime: v.number(),
      endpointId: v.id("endpoints"),
      method: v.string(),
      headers: v.record(v.string(), v.string()),
      body: v.union(v.string(), v.null()),
      bodySize: v.number(),
      timestamp: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[REQUESTS] getRequest - unauthorized", {
        requestId: args.id,
      });
      throw new Error("Unauthorized");
    }

    console.log("[REQUESTS] getRequest", {
      requestId: args.id,
      userId: redactUserId(userId),
    });

    const request = await ctx.db.get(args.id);
    if (!request) {
      console.log("[REQUESTS] getRequest - not found", {
        requestId: args.id,
        userId: redactUserId(userId),
      });
      return null;
    }

    const endpoint = await ctx.db.get(request.endpointId);
    if (!endpoint) {
      console.log("[REQUESTS] getRequest - endpoint not found", {
        requestId: args.id,
        endpointId: request.endpointId,
        userId: redactUserId(userId),
      });
      return null;
    }

    if (endpoint.userId !== userId) {
      console.log("[REQUESTS] getRequest - unauthorized access", {
        requestId: args.id,
        userId: redactUserId(userId),
        endpointUserId: redactUserId(endpoint.userId),
      });
      throw new Error("Unauthorized");
    }

    console.log("[REQUESTS] getRequest - result", {
      requestId: args.id,
      userId: redactUserId(userId),
      endpointId: request.endpointId,
      method: request.method,
      bodySize: request.bodySize,
    });

    return request;
  },
});
