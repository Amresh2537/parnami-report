import { NextResponse } from "next/server";
import { getNames } from "@/lib/mongo-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function classifyError(error: unknown): { message: string; status: number } {
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

  return { message: "Failed to fetch names.", status: 500 };
}

export async function GET() {
  try {
    const names = await getNames();
    return NextResponse.json({ names });
  } catch (error) {
    const { message, status } = classifyError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
