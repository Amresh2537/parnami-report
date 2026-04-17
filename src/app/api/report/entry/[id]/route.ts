import { NextRequest, NextResponse } from "next/server";
import { deleteEntry } from "@/lib/mongo-report";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
    }

    await deleteEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = classifyError(error, "Failed to delete entry.");
    return NextResponse.json({ error: message }, { status });
  }
}
