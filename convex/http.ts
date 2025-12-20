import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { polar } from "./polar";
import { api } from "./_generated/api";
import { createSafeLog, redactHeaders, redactBody } from "./utils/logging";

const http = httpRouter();

auth.addHttpRoutes(http);
polar.registerRoutes(http);

const webhookHandler = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts.length < 2 || pathParts[0] !== "webhook") {
    console.log("[HTTP] Webhook request - invalid path", {
      path: url.pathname,
      method: request.method,
    });
    return new Response("Not Found", { status: 404 });
  }

  const slug = pathParts[1];

  console.log("[HTTP] Webhook request received", {
    slug,
    method: request.method,
    path: url.pathname,
  });

  const endpoint = await ctx.runQuery(api.endpoints.query.getEndpointBySlug, {
    slug,
  });

  if (!endpoint) {
    console.log("[HTTP] Webhook endpoint not found", { slug });
    return new Response("Endpoint not found", { status: 404 });
  }

  if (!endpoint.active) {
    console.log("[HTTP] Webhook endpoint inactive", {
      slug,
      endpointId: endpoint._id,
    });
    return new Response("Endpoint is inactive", { status: 403 });
  }

  const method = request.method;
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body: string | null = null;
  let bodySize = 0;

  try {
    const bodyBytes = await request.arrayBuffer();
    bodySize = bodyBytes.byteLength;

    if (bodySize > 0) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const json = JSON.parse(new TextDecoder().decode(bodyBytes));
          body = JSON.stringify(json);
        } catch {
          body = new TextDecoder().decode(bodyBytes);
        }
      } else {
        body = new TextDecoder().decode(bodyBytes);
      }
    }
  } catch (error) {
    console.error("[HTTP] Error reading request body", {
      slug,
      endpointId: endpoint._id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    body = null;
  }

  const safeLog = createSafeLog({
    endpointId: endpoint._id,
    slug,
    method,
    headers,
    body,
    bodySize,
    timestamp: Date.now(),
  });

  console.log("[HTTP] Webhook request captured", safeLog);

  await ctx.runMutation(api.requests.mutation.createRequest, {
    endpointId: endpoint._id,
    method,
    headers,
    body,
    bodySize,
    timestamp: Date.now(),
  });

  console.log("[HTTP] Webhook request saved", {
    endpointId: endpoint._id,
    slug,
    method,
    bodySize,
  });

  return new Response("OK", { status: 200 });
});

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] as const;

for (const method of methods) {
  http.route({
    path: "/webhook",
    method,
    handler: webhookHandler,
  });
}

export default http;
