import { defineTable } from "convex/server";
import { v } from "convex/values";

export const requests = defineTable({
  endpointId: v.id("endpoints"),
  method: v.string(),
  headers: v.record(v.string(), v.string()),
  body: v.union(v.string(), v.null()),
  bodySize: v.number(),
  timestamp: v.number(),
}).index("by_endpoint", ["endpointId"]);

