import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { polar } from "./polar";
import { createSafeLog } from "./utils/logging";

const http = httpRouter();

auth.addHttpRoutes(http);
polar.registerRoutes(http, {
  path: "/polar/events",
  onSubscriptionUpdated: async (ctx, event) => {
    // Handle subscription updates, like cancellations.
    // Note that a cancelled subscription will not be deleted from the database,
    // so this information remains available without a hook, eg., via
    // `getCurrentSubscription()`.
    if (event.data.customerCancellationReason) {
      console.log(
        "[Polar] Customer cancelled",
        createSafeLog({ reason: event.data.customerCancellationReason })
      );
    }
  },
  onSubscriptionCreated: async (ctx, event) => {
    // Handle new subscriptions
    console.log(
      "[Polar] Subscription created",
      createSafeLog({ event })
    );
  },
  onProductCreated: async (ctx, event) => {
    // Handle new products
    console.log("[Polar] Product created", createSafeLog({ event }));
  },
  onProductUpdated: async (ctx, event) => {
    // Handle product updates
    console.log("[Polar] Product updated", createSafeLog({ event }));
  },
});

export default http;
