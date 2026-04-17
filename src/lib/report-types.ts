export type MasterRecord = {
  name: string;
  saleTarget: number;
  recoveryTarget: number;
  recovery45Target: number;
};

export type EntryRecord = {
  entryDate: string;
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
};

export type PerformanceRow = {
  sno: number;
  name: string;
  saleTarget: number;
  saleAchieved: number;
  saleBalance: number;
  salePercent: number;
  recoveryTarget: number;
  recoveryAchieved: number;
  recoveryBalance: number;
  recoveryPercent: number;
  recovery45Target: number;
  recovery45Achieved: number;
  recovery45Balance: number;
  recovery45Percent: number;
};

export type ReportResponse = {
  periodLabel: string;
  weekly: PerformanceRow[];
  cumulative: PerformanceRow[];
};

export type PrefillResponse = {
  name: string;
  saleTarget: number;
  recoveryTarget: number;
  recovery45Target: number;
};

export type HistoryEntry = {
  _id?: string;
  weekFrom: string;
  weekTo: string;
  saleTarget: number;
  saleAchieved: number;
  salePercent: number;
  recoveryTarget: number;
  recoveryAchieved: number;
  recoveryPercent: number;
  recovery45Target: number;
  recovery45Achieved: number;
  recovery45Percent: number;
  notes: string;
};

export type HistoryResponse = {
  name: string;
  entries: HistoryEntry[];
};
