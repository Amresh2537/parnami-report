import { NextRequest, NextResponse } from "next/server";
import { deleteEntry, updateEntry } from "@/lib/mongo-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntryRequestBody = {
  weekFrom?: string;
  weekTo?: string;
  name?: string;
  saleTarget?: number;
  saleAchieved?: number;
  recoveryTarget?: number;
  recoveryAchieved?: number;
  recovery45Target?: number;
  recovery45Achieved?: number;
  notes?: string;
};

function normalizeDate(dateValue: string | undefined): string {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value;
}

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
    console.error("[api/report/entry/:id] DELETE failed", error);
    const { message, status } = classifyError(error, "Failed to delete entry.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as EntryRequestBody;

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
    }

    const name = body.name?.trim() ?? "";
    const weekFrom = normalizeDate(body.weekFrom);
    const weekTo = normalizeDate(body.weekTo);

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!weekFrom || !weekTo) {
      return NextResponse.json({ error: "Valid week range is required." }, { status: 400 });
    }

    await updateEntry(id, {
      weekFrom,
      weekTo,
      name,
      saleTarget: normalizeNumber(body.saleTarget),
      saleAchieved: normalizeNumber(body.saleAchieved),
      recoveryTarget: normalizeNumber(body.recoveryTarget),
      recoveryAchieved: normalizeNumber(body.recoveryAchieved),
      recovery45Target: normalizeNumber(body.recovery45Target),
      recovery45Achieved: normalizeNumber(body.recovery45Achieved),
      notes: body.notes?.trim() ?? "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/report/entry/:id] PUT failed", error);
    const { message, status } = classifyError(error, "Failed to update entry.");
    return NextResponse.json({ error: message }, { status });
  }
}
