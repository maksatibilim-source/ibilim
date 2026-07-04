"use client";

import { useEffect, useState } from "react";
import type { TeamStats } from "@/lib/types";
import { api } from "@/lib/client";

interface TeamDashboardProps {
  open: boolean;
  onClose: () => void;
}

function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** Директорға арналған командалық Dashboard (орынбасарлардың жұмысы) */
export default function TeamDashboard({ open, onClose }: TeamDashboardProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    api
      .get<TeamStats>("/api/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Қате"))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const t = stats?.totals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Команда жұмысы (Dashboard)</h2>
            <p className="text-xs text-slate-500">
              Орынбасарлар мен қызметкерлердің тапсырма орындауы (барлық апталар)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Жүктелуде...</p>
          ) : error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
          ) : (
            <>
              {/* Жалпы санауыштар */}
              {t && (
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Барлығы" value={t.total} tone="slate" />
                  <StatCard label="Аяқталды" value={t.done} tone="emerald" />
                  <StatCard label="Орындалуда" value={t.in_progress} tone="amber" />
                  <StatCard label="Күтуде" value={t.pending} tone="rose" />
                </div>
              )}

              {/* Қызметкерлер кестесі */}
              {stats && stats.staff.length === 0 ? (
                <p className="text-sm text-slate-400">Қызметкерлер жоқ.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Қызметкер</th>
                        <th className="px-2 py-2 text-center font-semibold">Барлығы</th>
                        <th className="px-2 py-2 text-center font-semibold">Аяқталды</th>
                        <th className="px-2 py-2 text-center font-semibold">Орындалуда</th>
                        <th className="px-2 py-2 text-center font-semibold">Күтуде</th>
                        <th className="px-3 py-2 text-right font-semibold">Орындау %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats?.staff.map((s) => {
                        const p = pct(s.done, s.total);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-slate-800 dark:text-slate-100">{s.name}</p>
                              <p className="text-xs text-slate-400">{s.position}</p>
                            </td>
                            <td className="px-2 py-2.5 text-center text-slate-700">{s.total}</td>
                            <td className="px-2 py-2.5 text-center font-medium text-emerald-600">{s.done}</td>
                            <td className="px-2 py-2.5 text-center text-amber-600">{s.in_progress}</td>
                            <td className="px-2 py-2.5 text-center text-slate-500">{s.pending}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${p}%` }}
                                  />
                                </div>
                                <span className="w-9 text-right text-xs font-semibold text-slate-600">
                                  {p}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {t && t.unassigned > 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  Бекітілмеген тапсырмалар: {t.unassigned}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
