import { QueryCtx } from '../_generated/server';
import { getAuthUserId } from "@convex-dev/auth/server";

export async function getCurrentUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const user = ctx.db.get(userId);
  
  return user;
}