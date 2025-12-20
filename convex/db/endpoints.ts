import { defineTable } from "convex/server";
import { v } from "convex/values";

export const endpoints = defineTable({
  userId: v.id("users"),
  name: v.string(),
  slug: v.string(),
  active: v.boolean(),
})
  .index("by_user", ["userId"])
  .index("by_slug", ["slug"]);

