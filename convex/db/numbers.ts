import { defineTable } from "convex/server";
import { v } from "convex/values";

export const numbers = defineTable({
  value: v.number(),
});

