"use client";

import { useEffect, useState } from "react";
import type { ColumnId, Staff, TaskType, ViewRole } from "@/lib/types";
import { COLUMN_TITLES } from "@/lib/constants";

/** Жаңа тапсырманы құру кезінде берілетін деректер */
export interface NewTaskInput {
  title: string;
  type: TaskType;
  targetColumn: ColumnId;
  assignedTo: string | null;
}

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void;
  staffList: Staff[];
  role: ViewRole;
  /** Қызметкер көрінісінде тапсырма осы адамға бекітіледі */
  activeStaffId: string;
}

/** Директор көрінісінде қол жетімді бағандар */
const PRINCIPAL_TARGETS: ColumnId[] = [
  "unassigned",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "next_week",
];

/** Қызметкер көрінісінде тек апта күндері (жоғарғы контейнер көрінбейді) */
const STAFF_TARGETS: ColumnId[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "next_week",
];

export default function AddTaskModal({
  open,
  onClose,
  onSubmit,
  staffList,
  role,
  activeStaffId,
}: AddTaskModalProps) {
  const isPrincipal = role === "principal";
  const targets = isPrincipal ? PRINCIPAL_TARGETS : STAFF_TARGETS;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("minor");
  const [targetColumn, setTargetColumn] = useState<ColumnId>(targets[0]);
  const [assignedTo, setAssignedTo] = useState<string | null>(
    isPrincipal ? null : activeStaffId
  );
  const [error, setError] = useState("");

  // Модаль ашылған сайын форманы бастапқы күйге келтіру
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setType("minor");
    setTargetColumn(isPrincipal ? "unassigned" : "monday");
    setAssignedTo(isPrincipal ? null : activeStaffId);
    setError("");
  }, [open, isPrincipal, activeStaffId]);

  // Esc арқылы жабу
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Тапсырма атауын енгізіңіз");
      return;
    }
    onSubmit({
      title: trimmed,
      type,
      targetColumn,
      // Қызметкер көрінісінде тапсырма міндетті түрде сол адамға бекітіледі
      assignedTo: isPrincipal ? assignedTo : activeStaffId,
    });
    onClose();
  }

  const activeStaff = staffList.find((s) => s.id === activeStaffId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Жаңа тапсырма қосу"
    >
      {/* Артқы қараңғылау қабат */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Форма терезесі */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Жаңа тапсырма қосу</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Атауы */}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Тапсырма атауы
          </span>
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            placeholder="Мысалы: Ашық сабақ өткізу"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
        </label>

        {/* Түрі */}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Түрі</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="major">Маңызды</option>
            <option value="minor">Қосымша</option>
          </select>
        </label>

        {/* Қай бағанға қосу */}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Қайда қосу
          </span>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value as ColumnId)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {targets.map((id) => (
              <option key={id} value={id}>
                {COLUMN_TITLES[id]}
              </option>
            ))}
          </select>
        </label>

        {/* Кімге бекіту */}
        {isPrincipal ? (
          <label className="mb-5 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Кімге бекіту (міндетті емес)
            </span>
            <select
              value={assignedTo ?? ""}
              onChange={(e) => setAssignedTo(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Бекітілмеген</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="mb-5 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            Тапсырма{" "}
            <span className="font-semibold">{activeStaff?.name}</span> атына
            бекітіледі.
          </div>
        )}

        {/* Батырмалар */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Бас тарту
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
          >
            Қосу
          </button>
        </div>
      </form>
    </div>
  );
}
