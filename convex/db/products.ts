import { defineTable } from "convex/server";
import { v } from "convex/values";
import { vRecurringInterval } from "./types.js";

export const products = defineTable({
  id: v.string(),
  createdAt: v.string(),
  modifiedAt: v.union(v.string(), v.null()),
  name: v.string(),
  description: v.union(v.string(), v.null()),
  recurringInterval: v.optional(vRecurringInterval),
  isRecurring: v.boolean(),
  isArchived: v.boolean(),
  organizationId: v.string(),
  metadata: v.optional(v.record(v.string(), v.any())),
  prices: v.array(
    v.object({
      id: v.string(),
      createdAt: v.string(),
      modifiedAt: v.union(v.string(), v.null()),
      amountType: v.optional(v.string()),
      isArchived: v.boolean(),
      productId: v.string(),
      priceCurrency: v.optional(v.string()),
      priceAmount: v.optional(v.number()),
      type: v.optional(v.string()),
      recurringInterval: v.optional(vRecurringInterval),
      maximumAmount: v.optional(v.union(v.number(), v.null())),
      minimumAmount: v.optional(v.union(v.number(), v.null())),
      presetAmount: v.optional(v.union(v.number(), v.null())),
    }),
  ),
  medias: v.array(
    v.object({
      id: v.string(),
      organizationId: v.string(),
      name: v.string(),
      path: v.string(),
      mimeType: v.string(),
      size: v.number(),
      storageVersion: v.union(v.string(), v.null()),
      checksumEtag: v.union(v.string(), v.null()),
      checksumSha256Base64: v.union(v.string(), v.null()),
      checksumSha256Hex: v.union(v.string(), v.null()),
      createdAt: v.string(),
      lastModifiedAt: v.union(v.string(), v.null()),
      version: v.union(v.string(), v.null()),
      service: v.optional(v.string()),
      isUploaded: v.boolean(),
      sizeReadable: v.string(),
      publicUrl: v.string(),
    }),
  ),
})
  .index("id", ["id"])
  .index("isArchived", ["isArchived"]);

