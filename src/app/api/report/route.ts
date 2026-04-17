import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/mongo-report";

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

function parseDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const from = parseDate(request.nextUrl.searchParams.get("from"));
    const to = parseDate(request.nextUrl.searchParams.get("to"));

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both from and to query parameters are required in YYYY-MM-DD format." },
        { status: 400 },
      );
    }

    const data = await getReport(from, to);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/report] GET failed", error);
    const { message, status } = classifyError(error, "Failed to generate report.");
    return NextResponse.json({ error: message }, { status });
  }
}
