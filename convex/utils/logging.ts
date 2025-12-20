/**
 * Utility functions for logging with sensitive data redaction
 */

const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "auth-token",
  "x-access-token",
  "access-token",
  "x-secret",
  "secret",
  "password",
  "token",
];

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "authorization",
  "auth",
  "credentials",
];

/**
 * Redacts sensitive headers from a headers object
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.some((h) => lowerKey.includes(h))) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Redacts sensitive fields from an object
 */
export function redactObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      redacted[key] = redactObject(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Redacts email addresses (shows first 2 chars and domain)
 */
export function redactEmail(email: string | null | undefined): string {
  if (!email) return "[REDACTED]";
  const [local, domain] = email.split("@");
  if (!domain) return "[REDACTED]";
  if (local.length <= 2) return `[REDACTED]@${domain}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Redacts user IDs (shows first 8 chars)
 */
export function redactUserId(userId: string | null | undefined): string {
  if (!userId) return "[REDACTED]";
  if (userId.length <= 8) return "[REDACTED]";
  return `${userId.substring(0, 8)}...`;
}

/**
 * Redacts body content if it might contain sensitive data
 */
export function redactBody(body: string | null | undefined, maxLength: number = 500): string {
  if (!body) return "[EMPTY]";
  if (body.length > maxLength) {
    return `${body.substring(0, maxLength)}...[TRUNCATED]`;
  }
  try {
    const parsed = JSON.parse(body);
    const redacted = redactObject(parsed);
    return JSON.stringify(redacted);
  } catch {
    // Not JSON, return as-is but truncated
    return body.length > maxLength ? `${body.substring(0, maxLength)}...[TRUNCATED]` : body;
  }
}

/**
 * Creates a safe log object that redacts sensitive data
 */
export function createSafeLog(data: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "headers" && typeof value === "object") {
      safe[key] = redactHeaders(value as Record<string, string>);
    } else if (key === "body") {
      safe[key] = redactBody(value as string | null);
    } else if (key === "email" || key.toLowerCase().includes("email")) {
      safe[key] = redactEmail(value as string | null);
    } else if (key === "userId" || key === "user_id" || key.toLowerCase().includes("userid")) {
      safe[key] = redactUserId(value as string | null);
    } else if (typeof value === "object" && value !== null) {
      safe[key] = redactObject(value);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}
