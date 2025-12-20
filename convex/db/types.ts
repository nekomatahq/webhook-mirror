import { v } from "convex/values";

export const vRecurringInterval = v.union(
  v.literal("day"),
  v.literal("week"),
  v.literal("month"),
  v.literal("year"),
  v.null(),
);

