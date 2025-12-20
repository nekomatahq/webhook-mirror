import { mutation } from "../_generated/server";
import { v } from "convex/values";

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
    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    if (!endpoint.active) {
      throw new Error("Endpoint is inactive");
    }

    const requestId = await ctx.db.insert("requests", {
      endpointId: args.endpointId,
      method: args.method,
      headers: args.headers,
      body: args.body,
      bodySize: args.bodySize,
      timestamp: args.timestamp,
    });

    return { _id: requestId };
  },
});
