import { NextRequest, NextResponse } from "next/server";
import { getPrefill } from "@/lib/mongo-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function classifyError(error: unknown, fallback: string): { message: string; status: number } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("database authentication failed") || message.includes("mongodb_uri")) {
      return {
        message: "Database configuration error. Verify MONGODB_URI and restart the server.",
        status: 503,
      };
    }

    return { message: error.message, status: 500 };
  }

  return { message: fallback, status: 500 };
}

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const record = await getPrefill(name);

    if (!record) {
      return NextResponse.json({ error: "Name not found in sheet." }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    const { message, status } = classifyError(error, "Failed to fetch prefill data.");
    return NextResponse.json({ error: message }, { status });
  }
}
