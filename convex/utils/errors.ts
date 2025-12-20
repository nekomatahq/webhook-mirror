/**
 * Error codes for free tier limit violations.
 * These are used in ConvexError messages to allow frontend to handle them appropriately.
 */
export const FREE_ENDPOINT_LIMIT_REACHED =
  "FREE_ENDPOINT_LIMIT_REACHED" as const;
export const FREE_REQUEST_LIMIT_REACHED =
  "FREE_REQUEST_LIMIT_REACHED" as const;
export const FREE_REPLAY_DISABLED = "FREE_REPLAY_DISABLED" as const;
export const FREE_ACTIVATION_DISABLED = "FREE_ACTIVATION_DISABLED" as const;

export type FreeTierErrorCode =
  | typeof FREE_ENDPOINT_LIMIT_REACHED
  | typeof FREE_REQUEST_LIMIT_REACHED
  | typeof FREE_REPLAY_DISABLED
  | typeof FREE_ACTIVATION_DISABLED;

