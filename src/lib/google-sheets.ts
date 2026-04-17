import "server-only";

import type { EntryRecord, MasterRecord, ReportResponse } from "@/lib/report-types";

function getAppsScriptUrl(): string {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL environment variable is not set. Deploy your Apps Script and add the URL.");
  }
  return url;
}

export async function getNames(): Promise<string[]> {
  const url = getAppsScriptUrl();
  const response = await fetch(`${url}?action=names`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = (await response.json()) as { names?: string[]; error?: string };

  if (data.error) {
    throw new Error(data.error);
  }

  return data.names ?? [];
}

export async function getPrefill(name: string): Promise<MasterRecord | null> {
  const url = getAppsScriptUrl();
  const response = await fetch(`${url}?action=prefill&name=${encodeURIComponent(name)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = (await response.json()) as MasterRecord & { error?: string };

  if (data.error) {
    return null;
  }

  return {
    name: data.name,
    saleTarget: data.saleTarget,
    recoveryTarget: data.recoveryTarget,
    recovery45Target: data.recovery45Target,
  };
}

export async function getReport(from: string, to: string): Promise<ReportResponse> {
  const url = getAppsScriptUrl();
  const response = await fetch(`${url}?action=report&from=${from}&to=${to}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = (await response.json()) as ReportResponse & { error?: string };

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    periodLabel: data.periodLabel,
    weekly: data.weekly ?? [],
    cumulative: data.cumulative ?? [],
  };
}

export async function saveEntry(entry: {
  weekFrom: string;
  weekTo: string;
  name: string;
  saleAchieved: number;
  recoveryAchieved: number;
  recovery45Achieved: number;
  notes: string;
}): Promise<void> {
  const url = getAppsScriptUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "entry",
      ...entry,
    }),
  });

  const data = (await response.json()) as { success?: boolean; error?: string };

  if (data.error) {
    throw new Error(data.error);
  }
}
