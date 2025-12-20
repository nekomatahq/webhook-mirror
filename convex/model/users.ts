import { QueryCtx } from '../_generated/server';
import { getAuthUserId } from "@convex-dev/auth/server";
import { redactUserId } from "../utils/logging";

export async function getCurrentUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    console.log("[MODEL/USERS] getCurrentUser - no userId");
    return null;
  }
  
  console.log("[MODEL/USERS] getCurrentUser", {
    userId: redactUserId(userId),
  });

  const user = await ctx.db.get(userId);
  
  if (user) {
    console.log("[MODEL/USERS] getCurrentUser - found", {
      userId: redactUserId(userId),
      email: user.email ? "[REDACTED]" : null,
    });
  } else {
    console.log("[MODEL/USERS] getCurrentUser - user not found", {
      userId: redactUserId(userId),
    });
  }
  
  return user;
}