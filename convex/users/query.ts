import { query } from "../_generated/server";
import { getCurrentUser } from "../model/users";
import { redactUserId, redactEmail } from "../utils/logging";

export const getMe = query({
    handler: async (ctx) => {
      console.log("[USERS] getMe - starting");
      const user = await getCurrentUser(ctx);
      if (user) {
        console.log("[USERS] getMe - result", {
          userId: redactUserId(user._id),
          email: redactEmail(user.email),
        });
      } else {
        console.log("[USERS] getMe - no user");
      }
      return user;
    },
  });
  