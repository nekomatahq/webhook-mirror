import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";
import { redactUserId, redactHeaders, redactBody, createSafeLog } from "../utils/logging";
import { validateReplayUrl } from "../utils/url";

export const replayRequest = action({
  args: {
    requestId: v.id("requests"),
    targetUrl: v.string(),
  },
  returns: v.object({
    status: v.number(),
    statusText: v.string(),
    headers: v.record(v.string(), v.string()),
    body: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      console.log("[REQUESTS] replayRequest - unauthorized", {
        requestId: args.requestId,
      });
      throw new ConvexError("Unauthorized");
    }

    console.log("[REQUESTS] replayRequest", {
      requestId: args.requestId,
      userId: redactUserId(userId),
      targetUrl: args.targetUrl,
    });

    const request = await ctx.runQuery(api.requests.query.getRequest, {
      id: args.requestId,
    });

    if (!request) {
      console.log("[REQUESTS] replayRequest - request not found", {
        requestId: args.requestId,
        userId: redactUserId(userId),
      });
      throw new ConvexError("Request not found");
    }

    // Validate target URL early
    validateReplayUrl(args.targetUrl);

    try {
      // Filter out headers that shouldn't be forwarded
      const headersToSkip = new Set([
        "host",
        "connection",
        "content-length", // Let fetch set this automatically
        "transfer-encoding",
        "keep-alive",
        "upgrade",
        "proxy-authorization",
        "te",
        "trailer",
      ]);

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers)) {
        const lowerKey = key.toLowerCase();
        if (!headersToSkip.has(lowerKey)) {
          headers[key] = value;
        }
      }

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.body !== null && request.method !== "GET" && request.method !== "HEAD") {
        // Ensure body is sent as a string (fetch will handle encoding)
        fetchOptions.body = request.body;
      }

      console.log("[REQUESTS] replayRequest - sending", {
        requestId: args.requestId,
        userId: redactUserId(userId),
        targetUrl: args.targetUrl,
        method: request.method,
        headers: redactHeaders(headers),
        hasBody: request.body !== null,
      });

      const response = await fetch(args.targetUrl, fetchOptions);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody: string | null = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseBody = await response.json().then((json) => JSON.stringify(json, null, 2));
      } else {
        const text = await response.text();
        responseBody = text || null;
      }

      console.log("[REQUESTS] replayRequest - success", {
        requestId: args.requestId,
        userId: redactUserId(userId),
        targetUrl: args.targetUrl,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: redactHeaders(responseHeaders),
        responseBodySize: responseBody?.length || 0,
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        error: null,
      };
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide helpful message for forbidden/localhost errors
        if (
          errorMessage.includes("forbidden") ||
          errorMessage.includes("localhost") ||
          errorMessage.includes("private IP")
        ) {
          errorMessage =
            "Cannot replay to localhost or private IP addresses. Convex actions run in the cloud and cannot access local resources. Use a public URL or a tunnel service (like ngrok) for localhost testing.";
        }
      } else {
        errorMessage = "Unknown error";
      }

      console.error("[REQUESTS] replayRequest - error", {
        requestId: args.requestId,
        userId: redactUserId(userId),
        targetUrl: args.targetUrl,
        error: errorMessage,
      });
      return {
        status: 0,
        statusText: "",
        headers: {},
        body: null,
        error: errorMessage,
      };
    }
  },
});
