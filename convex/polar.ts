import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import { getCurrentUser } from "./model/users";
import { action } from "./_generated/server";

export const polar = new Polar(components.polar, {
  // Required: provide a function the component can use to get the current user's ID and
  // email - this will be used for retrieving the correct subscription data for the
  // current user. The function should return an object with `userId` and `email`
  // properties.
  getUserInfo: async (ctx) => {
    const user = await ctx.runQuery(api.users.query.getMe) as { _id: string, email: string | null };
    if (!user) return { userId: "", email: "" };
    return {
      userId: user._id,
      email: user.email ?? "",
    };
  },
  products: {
    premiumMonthly: "b0d785a4-9f0b-466b-b1a5-0955c7fda044",
  },
});

export const syncProducts = action({
    args: {},
    handler: async (ctx) => {
      await polar.syncProducts(ctx);
    },
});

// Export API functions from the Polar client
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();