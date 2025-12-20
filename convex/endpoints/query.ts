import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCurrentUser } from "../model/users";

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
      throw new Error("Unauthorized");
    }

    const endpoints = await ctx.db
      .query("endpoints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

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
      throw new Error("Unauthorized");
    }

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      return null;
    }

    if (endpoint.userId !== userId) {
      throw new Error("Unauthorized");
    }

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
    const endpoint = await ctx.db
      .query("endpoints")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    return endpoint ?? null;
  },
});
