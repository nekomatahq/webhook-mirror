import { action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";

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
      throw new Error("Unauthorized");
    }

    const request = await ctx.runQuery(api.requests.query.getRequest, {
      id: args.requestId,
    });

    if (!request) {
      throw new Error("Request not found");
    }

    try {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers)) {
        headers[key] = value;
      }

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.body !== null && request.method !== "GET" && request.method !== "HEAD") {
        fetchOptions.body = request.body;
      }

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

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        error: null,
      };
    } catch (error) {
      return {
        status: 0,
        statusText: "",
        headers: {},
        body: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
