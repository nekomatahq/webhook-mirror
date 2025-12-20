import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { redactUserId, createSafeLog } from "../utils/logging";
import { checkSubscriptionStatus } from "../utils/subscription";
import { FREE_ENDPOINT_LIMIT_REACHED, FREE_ACTIVATION_DISABLED } from "../utils/errors";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export const createEndpoint = mutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    _id: v.id("endpoints"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[ENDPOINTS] createEndpoint - unauthorized");
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] createEndpoint", {
      userId: redactUserId(userId),
      name: args.name,
    });

    // Check subscription status for free tier limits
    const hasActiveSubscription = await checkSubscriptionStatus(ctx);
    if (!hasActiveSubscription) {
      // Count existing endpoints for this user
      const allEndpoints = await ctx.db.query("endpoints").collect();
      const userEndpoints = allEndpoints.filter((e) => e.userId === userId);
      
      if (userEndpoints.length >= 1) {
        console.log("[ENDPOINTS] createEndpoint - free tier limit reached", {
          userId: redactUserId(userId),
          existingCount: userEndpoints.length,
        });
        throw new ConvexError(
          `Free tier includes 1 endpoint. Upgrade to unlock unlimited endpoints. Error code: ${FREE_ENDPOINT_LIMIT_REACHED}`
        );
      }
    }

    let slug: string;
    let exists = true;
    while (exists) {
      slug = generateSlug();
      const existing = await ctx.db
        .query("endpoints")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      exists = existing !== null;
    }

    const endpointId = await ctx.db.insert("endpoints", {
      userId,
      name: args.name,
      slug: slug!,
      active: true,
    });

    console.log("[ENDPOINTS] createEndpoint - created", {
      endpointId,
      userId: redactUserId(userId),
      slug: slug!,
      name: args.name,
    });

    return { _id: endpointId };
  },
});

export const updateEndpoint = mutation({
  args: {
    id: v.id("endpoints"),
    name: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[ENDPOINTS] updateEndpoint - unauthorized", {
        endpointId: args.id,
      });
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] updateEndpoint", {
      endpointId: args.id,
      userId: redactUserId(userId),
      updates: createSafeLog({
        name: args.name,
        active: args.active,
      }),
    });

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      console.log("[ENDPOINTS] updateEndpoint - not found", {
        endpointId: args.id,
        userId: redactUserId(userId),
      });
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      console.log("[ENDPOINTS] updateEndpoint - unauthorized access", {
        endpointId: args.id,
        userId: redactUserId(userId),
        endpointUserId: redactUserId(endpoint.userId),
      });
      throw new Error("Unauthorized");
    }

    // Check subscription status for free tier limits
    const hasActiveSubscription = await checkSubscriptionStatus(ctx);
    if (!hasActiveSubscription && args.active !== undefined) {
      console.log("[ENDPOINTS] updateEndpoint - free tier activation disabled", {
        endpointId: args.id,
        userId: redactUserId(userId),
      });
      throw new ConvexError(
        `Endpoint activation is available with Nekomata Suite. Error code: ${FREE_ACTIVATION_DISABLED}`
      );
    }

    const updates: {
      name?: string;
      active?: boolean;
    } = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.active !== undefined) {
      updates.active = args.active;
    }

    await ctx.db.patch(args.id, updates);

    console.log("[ENDPOINTS] updateEndpoint - updated", {
      endpointId: args.id,
      userId: redactUserId(userId),
      updates,
    });

    return null;
  },
});

export const deleteEndpoint = mutation({
  args: {
    id: v.id("endpoints"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[ENDPOINTS] deleteEndpoint - unauthorized", {
        endpointId: args.id,
      });
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] deleteEndpoint", {
      endpointId: args.id,
      userId: redactUserId(userId),
    });

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      console.log("[ENDPOINTS] deleteEndpoint - not found", {
        endpointId: args.id,
        userId: redactUserId(userId),
      });
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      console.log("[ENDPOINTS] deleteEndpoint - unauthorized access", {
        endpointId: args.id,
        userId: redactUserId(userId),
        endpointUserId: redactUserId(endpoint.userId),
      });
      throw new Error("Unauthorized");
    }

    const allRequests = await ctx.db.query("requests").collect();
    const requests = allRequests.filter((r) => r.endpointId === args.id);

    console.log("[ENDPOINTS] deleteEndpoint - deleting requests", {
      endpointId: args.id,
      requestCount: requests.length,
    });

    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    await ctx.db.delete(args.id);

    console.log("[ENDPOINTS] deleteEndpoint - deleted", {
      endpointId: args.id,
      userId: redactUserId(userId),
      deletedRequests: requests.length,
    });

    return null;
  },
});
