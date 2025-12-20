import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  endpoints: defineTable({
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    active: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"]),
  requests: defineTable({
    endpointId: v.id("endpoints"),
    method: v.string(),
    headers: v.record(v.string(), v.string()),
    body: v.union(v.string(), v.null()),
    bodySize: v.number(),
    timestamp: v.number(),
  }).index("by_endpoint", ["endpointId"]),
});
