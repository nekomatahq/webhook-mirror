import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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
    const endpoint = await convex.query(api.endpoints.query.getEndpointBySlug, {
      slug,
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    if (!endpoint.active) {
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
    } catch {
      body = null;
    }

    await convex.mutation(api.requests.mutation.createRequest, {
      endpointId: endpoint._id,
      method,
      headers,
      body,
      bodySize,
      timestamp: Date.now(),
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
