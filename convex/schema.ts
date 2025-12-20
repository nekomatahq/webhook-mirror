import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { numbers } from "./db/numbers.js";
import { endpoints } from "./db/endpoints.js";
import { requests } from "./db/requests.js";
import { customers } from "./db/customers.js";
import { products } from "./db/products.js";
import { subscriptions } from "./db/subscriptions.js";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema(
  {
    ...authTables,
    numbers,
    endpoints,
    requests,
    customers,
    products,
    subscriptions,
  },
  {
    schemaValidation: true,
  },
);
