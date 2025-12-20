import { defineTable } from "convex/server";
import { v } from "convex/values";

export const customers = defineTable({
  id: v.string(),
  userId: v.string(),
  metadata: v.optional(v.record(v.string(), v.any())),
})
  .index("userId", ["userId"])
  .index("id", ["id"]);

