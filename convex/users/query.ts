import { query } from "../_generated/server";
import { getCurrentUser } from "../model/users";
export const getMe = query({
    handler: async (ctx) => {
      return await getCurrentUser(ctx);
    },
  });
  