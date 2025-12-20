import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
      throw new Error("Unauthorized");
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
      throw new Error("Unauthorized");
    }

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      throw new Error("Unauthorized");
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
      throw new Error("Unauthorized");
    }

    const endpoint = await ctx.db.get(args.id);
    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_endpoint", (q) => q.eq("endpointId", args.id))
      .collect();

    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    await ctx.db.delete(args.id);

    return null;
  },
});
