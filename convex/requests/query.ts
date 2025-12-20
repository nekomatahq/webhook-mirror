import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
      throw new Error("Unauthorized");
    }

    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    if (endpoint.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_endpoint", (q) => q.eq("endpointId", args.endpointId))
      .order("desc")
      .collect();

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
      throw new Error("Unauthorized");
    }

    const request = await ctx.db.get(args.id);
    if (!request) {
      return null;
    }

    const endpoint = await ctx.db.get(request.endpointId);
    if (!endpoint) {
      return null;
    }

    if (endpoint.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return request;
  },
});
