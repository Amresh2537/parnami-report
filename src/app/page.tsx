"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PrefillResponse, ReportResponse, HistoryResponse } from "@/lib/report-types";

type EntryFormState = {
  weekFrom: string;
  weekTo: string;
  name: string;
  newName: string;
  saleTarget: string;
  saleAchieved: string;
  recoveryTarget: string;
  recoveryAchieved: string;
  recovery45Target: string;
  recovery45Achieved: string;
  notes: string;
};

function numberFormatter(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function percentFormatter(value: number) {
  return `${numberFormatter(value)}%`;
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekFrom: monday.toISOString().slice(0, 10),
    weekTo: sunday.toISOString().slice(0, 10),
  };
}

function DataTable({
  title,
  periodLabel,
  rows,
}: {
  title: string;
  periodLabel?: string;
  rows: ReportResponse["weekly"];
}) {
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {periodLabel ? <p>{periodLabel}</p> : null}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Sale Target</th>
              <th>Achieved</th>
              <th>Balance</th>
              <th>Ach %</th>
              <th>Recovery Target</th>
              <th>Achieved</th>
              <th>Balance</th>
              <th>Ach %</th>
              <th>Rec Tar abv 45 days</th>
              <th>Achieved</th>
              <th>Balance</th>
              <th>Ach %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="empty-cell">
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.name}`}>
                  <td>{row.sno}</td>
                  <td>{row.name}</td>
                  <td>{numberFormatter(row.saleTarget)}</td>
                  <td>{numberFormatter(row.saleAchieved)}</td>
                  <td>{numberFormatter(row.saleBalance)}</td>
                  <td>{percentFormatter(row.salePercent)}</td>
                  <td>{numberFormatter(row.recoveryTarget)}</td>
                  <td>{numberFormatter(row.recoveryAchieved)}</td>
                  <td>{numberFormatter(row.recoveryBalance)}</td>
                  <td>{percentFormatter(row.recoveryPercent)}</td>
                  <td>{numberFormatter(row.recovery45Target)}</td>
                  <td>{numberFormatter(row.recovery45Achieved)}</td>
                  <td>{numberFormatter(row.recovery45Balance)}</td>
                  <td>{percentFormatter(row.recovery45Percent)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Home() {
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  const [names, setNames] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<PrefillResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNewSalesperson, setIsNewSalesperson] = useState(false);
  const [selectedNameFilter, setSelectedNameFilter] = useState<string>("");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [form, setForm] = useState<EntryFormState>({
    weekFrom: weekRange.weekFrom,
    weekTo: weekRange.weekTo,
    name: "",
    newName: "",
    saleTarget: "",
    saleAchieved: "",
    recoveryTarget: "",
    recoveryAchieved: "",
    recovery45Target: "",
    recovery45Achieved: "",
    notes: "",
  });

  async function loadNames() {
    try {
      const response = await fetch("/api/report/names", {
        cache: "no-store",
      });
      const data = (await response.json()) as { names?: string[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load names.");
      }

      setNames(data.names ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load names.";
      setStatus(message);
    }
  }

  async function loadPrefill(name: string) {
    if (!name) {
      setPrefill(null);
      return;
    }

    try {
      const response = await fetch(`/api/report/prefill?name=${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as PrefillResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load targets.");
      }

      setPrefill(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load targets.";
      setStatus(message);
      setPrefill(null);
    }
  }

  async function loadReport(from: string, to: string) {
    if (!from || !to) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/report?from=${from}&to=${to}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as ReportResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load report.");
      }

      setReport(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load report.";
      setStatus(message);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadHistory(name: string) {
    if (!name) {
      setHistory(null);
      return;
    }

    try {
      const response = await fetch(`/api/report/history?name=${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as HistoryResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load history.");
      }

      setHistory(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load history.";
      setStatus(message);
      setHistory(null);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/report/entry/${entryId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete entry.");
      }

      setStatus("Entry deleted successfully.");
      if (selectedNameFilter) {
        await loadHistory(selectedNameFilter);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete entry.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEditEntry(entryId: string) {
    if (!history) return;
    const entry = history.entries.find((e) => e._id === entryId);
    if (!entry) return;

    setForm({
      weekFrom: entry.weekFrom,
      weekTo: entry.weekTo,
      name: history.name,
      newName: "",
      saleTarget: String(entry.saleTarget),
      saleAchieved: String(entry.saleAchieved),
      recoveryTarget: String(entry.recoveryTarget),
      recoveryAchieved: String(entry.recoveryAchieved),
      recovery45Target: String(entry.recovery45Target),
      recovery45Achieved: String(entry.recovery45Achieved),
      notes: entry.notes,
    });
    setEditingEntryId(entryId);
    setFormModalOpen(true);
  }

  function openNewEntryForm() {
    setForm({
      weekFrom: weekRange.weekFrom,
      weekTo: weekRange.weekTo,
      name: selectedNameFilter || "",
      newName: "",
      saleTarget: "",
      saleAchieved: "",
      recoveryTarget: "",
      recoveryAchieved: "",
      recovery45Target: "",
      recovery45Achieved: "",
      notes: "",
    });
    setEditingEntryId(null);
    setIsNewSalesperson(false);
    setPrefill(null);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingEntryId(null);
  }

  useEffect(() => {
    void loadNames();
  }, []);

  useEffect(() => {
    void loadReport(form.weekFrom, form.weekTo);
  }, [form.weekFrom, form.weekTo]);

  useEffect(() => {
    void loadPrefill(form.name);
  }, [form.name]);

  useEffect(() => {
    void loadHistory(selectedNameFilter);
  }, [selectedNameFilter]);

  useEffect(() => {
    if (!prefill || isNewSalesperson) {
      return;
    }

    setForm((current) => ({
      ...current,
      saleTarget: String(prefill.saleTarget ?? 0),
      recoveryTarget: String(prefill.recoveryTarget ?? 0),
      recovery45Target: String(prefill.recovery45Target ?? 0),
    }));
  }, [prefill, isNewSalesperson]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const finalName = isNewSalesperson ? form.newName.trim() : form.name;

    if (!finalName) {
      setStatus("Please select or enter a name.");
      return;
    }

    const body = {
      weekFrom: form.weekFrom,
      weekTo: form.weekTo,
      name: finalName,
      saleTarget: Number(form.saleTarget || 0),
      saleAchieved: Number(form.saleAchieved || 0),
      recoveryTarget: Number(form.recoveryTarget || 0),
      recoveryAchieved: Number(form.recoveryAchieved || 0),
      recovery45Target: Number(form.recovery45Target || 0),
      recovery45Achieved: Number(form.recovery45Achieved || 0),
      notes: form.notes,
    };

    try {
      setIsLoading(true);
      setStatus(editingEntryId ? "Updating entry..." : "Saving weekly achievement...");

      const response = await fetch("/api/report/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save entry.");
      }

      setStatus(editingEntryId ? "Entry updated successfully." : "Weekly achievement saved successfully.");
      
      // Reset form and close modal
      setForm((current) => ({
        ...current,
        name: isNewSalesperson ? finalName : current.name,
        newName: "",
        saleAchieved: "",
        recoveryAchieved: "",
        recovery45Achieved: "",
        notes: "",
      }));
      setIsNewSalesperson(false);
      closeFormModal();

      await loadNames();
      await loadPrefill(finalName);
      if (selectedNameFilter === finalName || !selectedNameFilter) {
        await loadHistory(finalName);
      }
      await loadReport(form.weekFrom, form.weekTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save entry.";
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="report-shell">
      <header className="hero">
        <div>
          <p className="badge">MongoDB Backend</p>
          <h1>Weekly Sale And Recovery Target Report</h1>
          <p className="subhead">
            Select team member, fill weekly achieved values, and instantly track individual and cumulative performance.
          </p>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <div className="panel-head">
            <h2>📝 Add Weekly Entry</h2>
            <p>Plan targets in advance or record achievements for the current week.</p>
          </div>
          <button className="open-form-btn" onClick={openNewEntryForm}>
            + New Entry
          </button>
        </section>

        {selectedNameFilter && history && (
          <section className="panel">
            <div className="panel-head">
              <h2>Recent Activity - {history.name}</h2>
              <p>{history.entries.slice(0, 3).length} recent weeks</p>
            </div>
            <div className="recent-list">
              {history.entries.slice(0, 3).map((entry) => (
                <div key={entry._id} className="recent-item">
                  <div>
                    <strong>{entry.weekFrom} to {entry.weekTo}</strong>
                    <p>Sale: {percentFormatter(entry.salePercent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {formModalOpen && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEntryId ? "Edit Entry" : "New Weekly Entry"}</h2>
              <button className="modal-close" onClick={closeFormModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="entry-form">
            <label>
              Week From
              <input
                type="date"
                value={form.weekFrom}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weekFrom: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Week To
              <input
                type="date"
                value={form.weekTo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weekTo: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Name
              <select
                value={isNewSalesperson ? "__new__" : form.name}
                onChange={(event) =>
                  (() => {
                    const selected = event.target.value;
                    if (selected === "__new__") {
                      setIsNewSalesperson(true);
                      setPrefill(null);
                      setForm((current) => ({
                        ...current,
                        name: "",
                        saleTarget: "",
                        recoveryTarget: "",
                        recovery45Target: "",
                      }));
                      return;
                    }

                    setIsNewSalesperson(false);
                    setForm((current) => ({
                      ...current,
                      name: selected,
                    }));
                  })()
                }
                disabled={editingEntryId ? true : false}
                required
              >
                <option value="">Select team member</option>
                {!editingEntryId && <option value="__new__">+ Add New Salesperson</option>}
                {names.map((name) => (
                  <option value={name} key={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            {isNewSalesperson ? (
              <label>
                New Salesperson Name
                <input
                  type="text"
                  value={form.newName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      newName: event.target.value,
                    }))
                  }
                  placeholder="Enter new salesperson name"
                  required
                />
              </label>
            ) : null}

            <div className="targets">
              <div className="stat-card">
                <span>Sale Target</span>
                <strong>{numberFormatter(Number(form.saleTarget || 0))}</strong>
              </div>
              <div className="stat-card">
                <span>Recovery Target</span>
                <strong>{numberFormatter(Number(form.recoveryTarget || 0))}</strong>
              </div>
              <div className="stat-card">
                <span>Rec Tar abv 45 days</span>
                <strong>{numberFormatter(Number(form.recovery45Target || 0))}</strong>
              </div>
            </div>

            <label>
              Sale Target
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.saleTarget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    saleTarget: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Recovery Target
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.recoveryTarget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recoveryTarget: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Rec Tar abv 45 days
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.recovery45Target}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recovery45Target: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Sale Achieved (weekly)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.saleAchieved}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    saleAchieved: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Recovery Achieved (weekly)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.recoveryAchieved}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recoveryAchieved: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Rec Achieved Above 45 Days (weekly)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.recovery45Achieved}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recovery45Achieved: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Optional comments for this week"
              />
            </label>

            <button type="submit" disabled={isLoading}>
              {isLoading ? (editingEntryId ? "Updating..." : "Saving...") : (editingEntryId ? "Update Entry" : "Save Entry")}
            </button>

            {status && <p className="status-text">{status}</p>}
            </form>
          </div>
        </div>
      )}

      <section className="filter-section">
        <div className="filter-header">
          <h2>Report Filters</h2>
        </div>
        <div className="filter-controls">
          <label>
            Select Salesperson
            <select
              value={selectedNameFilter}
              onChange={(event) => setSelectedNameFilter(event.target.value)}
            >
              <option value="">-- Select Person --</option>
              {names.map((name) => (
                <option value={name} key={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            From Date
            <input
              type="date"
              value={form.weekFrom}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  weekFrom: event.target.value,
                }))
              }
            />
          </label>
          <label>
            To Date
            <input
              type="date"
              value={form.weekTo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  weekTo: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      {selectedNameFilter && history ? (
        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Weekly Performance History - {history.name}</h2>
            <p>{history.entries.length} weeks found</p>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Week From</th>
                  <th>Week To</th>
                  <th>Sale Target</th>
                  <th>Achieved</th>
                  <th>%</th>
                  <th>Recovery Target</th>
                  <th>Achieved</th>
                  <th>%</th>
                  <th>45+ Days Target</th>
                  <th>Achieved</th>
                  <th>%</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.entries.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="empty-cell">
                      No data available for this person.
                    </td>
                  </tr>
                ) : (
                  history.entries.map((entry) => (
                    <tr key={entry._id}>
                      <td>{entry.weekFrom}</td>
                      <td>{entry.weekTo}</td>
                      <td>{numberFormatter(entry.saleTarget)}</td>
                      <td>{numberFormatter(entry.saleAchieved)}</td>
                      <td>{percentFormatter(entry.salePercent)}</td>
                      <td>{numberFormatter(entry.recoveryTarget)}</td>
                      <td>{numberFormatter(entry.recoveryAchieved)}</td>
                      <td>{percentFormatter(entry.recoveryPercent)}</td>
                      <td>{numberFormatter(entry.recovery45Target)}</td>
                      <td>{numberFormatter(entry.recovery45Achieved)}</td>
                      <td>{percentFormatter(entry.recovery45Percent)}</td>
                      <td className="notes-cell">{entry.notes}</td>
                      <td className="action-cell">
                        <button
                          className="edit-btn"
                          onClick={() => entry._id && handleEditEntry(entry._id)}
                          disabled={isLoading}
                          title="Edit entry"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => entry._id && handleDeleteEntry(entry._id)}
                          disabled={isLoading}
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="tables-stack">
        <DataTable
          title="Weekly Sale And Recovery Target Report"
          periodLabel={report?.periodLabel}
          rows={report?.weekly ?? []}
        />

        <DataTable title="Cumulative Performance Report" rows={report?.cumulative ?? []} />
      </section>
    </div>
  );
}
