import { getDb } from "./mongodb";
import type { MasterRecord, ReportResponse, HistoryResponse } from "@/lib/report-types";
import { ObjectId } from "mongodb";

const COLLECTION = "entries";

export async function getNames(): Promise<string[]> {
  const db = await getDb();
  const names = await db.collection(COLLECTION).distinct("name");
  return (names as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export async function getPrefill(name: string): Promise<MasterRecord | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTION)
    .find({ name })
    .sort({ weekTo: -1 })
    .limit(1)
    .next();
  if (!doc) return null;
  return {
    name: doc.name,
    saleTarget: doc.saleTarget || 0,
    recoveryTarget: doc.recoveryTarget || 0,
    recovery45Target: doc.recovery45Target || 0,
  };
}

export async function getReport(from: string, to: string): Promise<ReportResponse> {
  const db = await getDb();
  const entries = await db.collection(COLLECTION)
    .find({ weekTo: { $lte: to } })
    .toArray();

  // Weekly
  const weekly = entries.filter(e => e.weekFrom === from && e.weekTo === to);
  const names = Array.from(new Set(entries.map(e => e.name)));

  function sumRows(rows: any[]) {
    return rows.reduce((acc, row) => {
      acc.saleTarget += row.saleTarget || 0;
      acc.saleAchieved += row.saleAchieved || 0;
      acc.recoveryTarget += row.recoveryTarget || 0;
      acc.recoveryAchieved += row.recoveryAchieved || 0;
      acc.recovery45Target += row.recovery45Target || 0;
      acc.recovery45Achieved += row.recovery45Achieved || 0;
      return acc;
    }, {
      saleTarget: 0, saleAchieved: 0, recoveryTarget: 0, recoveryAchieved: 0, recovery45Target: 0, recovery45Achieved: 0
    });
  }

  function perfRow(sno: number, name: string, sum: any) {
    return {
      sno,
      name,
      saleTarget: sum.saleTarget,
      saleAchieved: sum.saleAchieved,
      saleBalance: sum.saleTarget - sum.saleAchieved,
      salePercent: sum.saleTarget > 0 ? Math.round((sum.saleAchieved / sum.saleTarget) * 10000) / 100 : 0,
      recoveryTarget: sum.recoveryTarget,
      recoveryAchieved: sum.recoveryAchieved,
      recoveryBalance: sum.recoveryTarget - sum.recoveryAchieved,
      recoveryPercent: sum.recoveryTarget > 0 ? Math.round((sum.recoveryAchieved / sum.recoveryTarget) * 10000) / 100 : 0,
      recovery45Target: sum.recovery45Target,
      recovery45Achieved: sum.recovery45Achieved,
      recovery45Balance: sum.recovery45Target - sum.recovery45Achieved,
      recovery45Percent: sum.recovery45Target > 0 ? Math.round((sum.recovery45Achieved / sum.recovery45Target) * 10000) / 100 : 0,
    };
  }

  const weeklyRows = names.map((name, i) => {
    const rows = weekly.filter(e => e.name === name);
    return perfRow(i + 1, name, sumRows(rows));
  });

  const cumulativeRows = names.map((name, i) => {
    const rows = entries.filter(e => e.name === name);
    return perfRow(i + 1, name, sumRows(rows));
  });

  return {
    periodLabel: `Weekly Sale And Recovery Target Report (${from} to ${to})`,
    weekly: weeklyRows,
    cumulative: cumulativeRows,
  };
}

export async function saveEntry(entry: {
  weekFrom: string;
  weekTo: string;
  name: string;
  saleTarget: number;
  saleAchieved: number;
  recoveryTarget: number;
  recoveryAchieved: number;
  recovery45Target: number;
  recovery45Achieved: number;
  notes: string;
}): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).insertOne({
    entryDate: new Date().toISOString().slice(0, 10),
    weekFrom: entry.weekFrom,
    weekTo: entry.weekTo,
    name: entry.name,
    saleTarget: entry.saleTarget,
    saleAchieved: entry.saleAchieved,
    recoveryTarget: entry.recoveryTarget,
    recoveryAchieved: entry.recoveryAchieved,
    recovery45Target: entry.recovery45Target,
    recovery45Achieved: entry.recovery45Achieved,
    notes: entry.notes,
  });
}

export async function updateEntry(entryId: string, entry: {
  weekFrom: string;
  weekTo: string;
  name: string;
  saleTarget: number;
  saleAchieved: number;
  recoveryTarget: number;
  recoveryAchieved: number;
  recovery45Target: number;
  recovery45Achieved: number;
  notes: string;
}): Promise<void> {
  const db = await getDb();

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(entryId);
  } catch {
    throw new Error("Invalid entry id.");
  }

  const result = await db.collection(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: {
        weekFrom: entry.weekFrom,
        weekTo: entry.weekTo,
        name: entry.name,
        saleTarget: entry.saleTarget,
        saleAchieved: entry.saleAchieved,
        recoveryTarget: entry.recoveryTarget,
        recoveryAchieved: entry.recoveryAchieved,
        recovery45Target: entry.recovery45Target,
        recovery45Achieved: entry.recovery45Achieved,
        notes: entry.notes,
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new Error("Entry not found.");
  }
}

export async function getNameHistory(name: string): Promise<HistoryResponse> {
  const db = await getDb();
  const docs = await db.collection(COLLECTION)
    .find({ name })
    .sort({ weekTo: -1 })
    .toArray();

  const entries = docs.map((doc: any) => {
    const salePercent = doc.saleTarget > 0 ? Math.round((doc.saleAchieved / doc.saleTarget) * 10000) / 100 : 0;
    const recoveryPercent = doc.recoveryTarget > 0 ? Math.round((doc.recoveryAchieved / doc.recoveryTarget) * 10000) / 100 : 0;
    const recovery45Percent = doc.recovery45Target > 0 ? Math.round((doc.recovery45Achieved / doc.recovery45Target) * 10000) / 100 : 0;

    return {
      _id: doc._id?.toString(),
      weekFrom: doc.weekFrom,
      weekTo: doc.weekTo,
      saleTarget: doc.saleTarget || 0,
      saleAchieved: doc.saleAchieved || 0,
      salePercent,
      recoveryTarget: doc.recoveryTarget || 0,
      recoveryAchieved: doc.recoveryAchieved || 0,
      recoveryPercent,
      recovery45Target: doc.recovery45Target || 0,
      recovery45Achieved: doc.recovery45Achieved || 0,
      recovery45Percent,
      notes: doc.notes || "",
    };
  });

  return {
    name,
    entries,
  };
}

export async function deleteEntry(entryId: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({
    _id: new ObjectId(entryId),
  });
}
