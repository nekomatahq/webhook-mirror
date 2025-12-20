import type {
  GenericMutationCtx,
  GenericActionCtx,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import type { Infer } from "convex/values";
import type schema from "./schema.js";

export type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
export type RunMutationCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
export type RunActionCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
  runAction: GenericActionCtx<GenericDataModel>["runAction"];
};

const VALID_RECURRING_INTERVALS = ["day", "week", "month", "year"] as const;
type ValidRecurringInterval = typeof VALID_RECURRING_INTERVALS[number];

const convertRecurringInterval = (
  interval: string | null | undefined,
): ValidRecurringInterval | null => {
  if (!interval) {
    return null;
  }
  if (VALID_RECURRING_INTERVALS.includes(interval as ValidRecurringInterval)) {
    return interval as ValidRecurringInterval;
  }
  return null;
};

type PriceWithRequiredFields = {
  id: string;
  productId: string;
  isArchived: boolean;
  createdAt: Date;
  modifiedAt?: Date | null;
  amountType?: string;
  type?: string;
  recurringInterval?: string | null;
  priceAmount?: number;
  priceCurrency?: string;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  presetAmount?: number | null;
};

const isValidPrice = (price: unknown): price is PriceWithRequiredFields => {
  return (
    typeof price === "object" &&
    price !== null &&
    "id" in price &&
    "productId" in price &&
    "isArchived" in price &&
    "createdAt" in price &&
    typeof (price as { id: unknown }).id === "string" &&
    typeof (price as { productId: unknown }).productId === "string" &&
    typeof (price as { isArchived: unknown }).isArchived === "boolean" &&
    (price as { createdAt: unknown }).createdAt instanceof Date
  );
};

export const convertToDatabaseSubscription = (
  subscription: Subscription,
): Infer<typeof schema.tables.subscriptions.validator> => {
  return {
    id: subscription.id,
    customerId: subscription.customerId,
    createdAt: subscription.createdAt.toISOString(),
    modifiedAt: subscription.modifiedAt?.toISOString() ?? null,
    productId: subscription.productId,
    checkoutId: subscription.checkoutId,
    amount: subscription.amount,
    currency: subscription.currency,
    recurringInterval: convertRecurringInterval(
      subscription.recurringInterval ?? null,
    ),
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    customerCancellationReason: subscription.customerCancellationReason,
    customerCancellationComment: subscription.customerCancellationComment,
    startedAt: subscription.startedAt?.toISOString() ?? null,
    endedAt: subscription.endedAt?.toISOString() ?? null,
    metadata: subscription.metadata,
  };
};

export const convertToDatabaseProduct = (
  product: Product,
): Infer<typeof schema.tables.products.validator> => {
  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    description: product.description,
    isRecurring: product.isRecurring,
    isArchived: product.isArchived,
    createdAt: product.createdAt.toISOString(),
    modifiedAt: product.modifiedAt?.toISOString() ?? null,
    recurringInterval: convertRecurringInterval(
      product.recurringInterval ?? null,
    ),
    metadata: product.metadata,
    prices: (product.prices.filter(isValidPrice) as PriceWithRequiredFields[]).map(
      (p) => ({
        id: p.id,
        productId: p.productId,
        amountType: p.amountType,
        isArchived: p.isArchived,
        createdAt: p.createdAt.toISOString(),
        modifiedAt: p.modifiedAt?.toISOString() ?? null,
        recurringInterval:
          p.type === "recurring"
            ? convertRecurringInterval(p.recurringInterval ?? null) ??
              undefined
            : undefined,
        priceAmount:
          p.amountType === "fixed" ? p.priceAmount : undefined,
        priceCurrency:
          p.amountType === "fixed" || p.amountType === "custom"
            ? p.priceCurrency
            : undefined,
        minimumAmount:
          p.amountType === "custom" ? p.minimumAmount : undefined,
        maximumAmount:
          p.amountType === "custom" ? p.maximumAmount : undefined,
        presetAmount:
          p.amountType === "custom" ? p.presetAmount : undefined,
        type: p.type,
      }),
    ),
    medias: product.medias.map((media) => ({
      id: media.id,
      organizationId: media.organizationId,
      name: media.name,
      path: media.path,
      mimeType: media.mimeType,
      size: media.size,
      storageVersion: media.storageVersion,
      checksumEtag: media.checksumEtag,
      checksumSha256Base64: media.checksumSha256Base64,
      checksumSha256Hex: media.checksumSha256Hex,
      createdAt: media.createdAt.toISOString(),
      lastModifiedAt: media.lastModifiedAt?.toISOString() ?? null,
      version: media.version,
      isUploaded: media.isUploaded,
      sizeReadable: media.sizeReadable,
      publicUrl: media.publicUrl,
    })),
  };
};
