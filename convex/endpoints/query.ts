import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCurrentUser } from "../model/users";
import { redactUserId } from "../utils/logging";

export const listEndpoints = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("endpoints"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      slug: v.string(),
      active: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[ENDPOINTS] listEndpoints - unauthorized");
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] listEndpoints", {
      userId: redactUserId(userId),
    });

    const endpoints = await ctx.db
      .query("endpoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    console.log("[ENDPOINTS] listEndpoints - result", {
      userId: redactUserId(userId),
      count: endpoints.length,
    });

    return endpoints;
  },
});

export const getEndpoint = query({
  args: {
    id: v.id("endpoints"),
  },
  returns: v.union(
    v.object({
      _id: v.id("endpoints"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      slug: v.string(),
      active: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[ENDPOINTS] getEndpoint - unauthorized", {
        endpointId: args.id,
      });
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] getEndpoint", {
      endpointId: args.id,
      userId: redactUserId(userId),
    });

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      console.log("[ENDPOINTS] getEndpoint - not found", {
        endpointId: args.id,
        userId: redactUserId(userId),
      });
      return null;
    }

    if (endpoint.userId !== userId) {
      console.log("[ENDPOINTS] getEndpoint - unauthorized access", {
        endpointId: args.id,
        userId: redactUserId(userId),
        endpointUserId: redactUserId(endpoint.userId),
      });
      throw new Error("Unauthorized");
    }

    console.log("[ENDPOINTS] getEndpoint - result", {
      endpointId: args.id,
      userId: redactUserId(userId),
      slug: endpoint.slug,
      active: endpoint.active,
    });

    return endpoint;
  },
});

export const getEndpointBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("endpoints"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      slug: v.string(),
      active: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    console.log("[ENDPOINTS] getEndpointBySlug", {
      slug: args.slug,
    });

    const endpoint = await ctx.db
      .query("endpoints")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (endpoint) {
      console.log("[ENDPOINTS] getEndpointBySlug - found", {
        slug: args.slug,
        endpointId: endpoint._id,
        active: endpoint.active,
      });
    } else {
      console.log("[ENDPOINTS] getEndpointBySlug - not found", {
        slug: args.slug,
      });
    }

    return endpoint ?? null;
  },
});
