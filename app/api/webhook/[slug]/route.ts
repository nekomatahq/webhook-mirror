import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createSafeLog } from "@/convex/utils/logging";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return handleWebhook(request, params.slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return handleWebhook(request, params.slug);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return handleWebhook(request, params.slug);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return handleWebhook(request, params.slug);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return handleWebhook(request, params.slug);
}

async function handleWebhook(request: NextRequest, slug: string) {
  try {
    console.log(
      "[HTTP] Webhook request received",
      createSafeLog({
        slug,
        method: request.method,
        path: request.nextUrl.pathname,
      })
    );

    const endpoint = await convex.query(api.endpoints.query.getEndpointBySlug, {
      slug,
    });

    if (!endpoint) {
      console.log(
        "[HTTP] Webhook endpoint not found",
        createSafeLog({ slug })
      );
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    if (!endpoint.active) {
      console.log(
        "[HTTP] Webhook endpoint inactive",
        createSafeLog({
          slug,
          endpointId: endpoint._id,
        })
      );
      return NextResponse.json(
        { error: "Endpoint is inactive" },
        { status: 403 }
      );
    }

    const method = request.method;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: string | null = null;
    let bodySize = 0;

    try {
      const bodyText = await request.text();
      bodySize = new TextEncoder().encode(bodyText).length;

      if (bodySize > 0) {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const json = JSON.parse(bodyText);
            body = JSON.stringify(json);
          } catch {
            body = bodyText;
          }
        } else {
          body = bodyText;
        }
      }
    } catch (error) {
      console.error(
        "[HTTP] Error reading request body",
        createSafeLog({
          slug,
          endpointId: endpoint._id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      );
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

    await convex.mutation(api.requests.mutation.createRequest, {
      endpointId: endpoint._id,
      method,
      headers,
      body,
      bodySize,
      timestamp: Date.now(),
    });

    console.log(
      "[HTTP] Webhook request saved",
      createSafeLog({
        endpointId: endpoint._id,
        slug,
        method,
        bodySize,
      })
    );

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error(
      "[HTTP] Webhook error",
      createSafeLog({
        slug,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
