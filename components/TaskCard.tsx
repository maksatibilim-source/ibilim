"use client";

import { useEffect, useRef, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Staff, Task, TaskStatus, TaskType } from "@/lib/types";

// ----------------------------------------------------------------------------
//  Көмекші: тапсырма түрі мен күйінің қазақша белгілері
// ----------------------------------------------------------------------------

const TYPE_LABEL: Record<TaskType, string> = {
  major: "Маңызды",
  minor: "Қосымша",
};

const TYPE_BADGE: Record<TaskType, string> = {
  major: "bg-rose-100 text-rose-700 ring-rose-200",
  minor: "bg-sky-100 text-sky-700 ring-sky-200",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Күтуде",
  in_progress: "Орындалуда",
  done: "Аяқталды",
};

const STATUS_DOT: Record<TaskStatus, string> = {
  pending: "bg-slate-400",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
};

// ----------------------------------------------------------------------------
//  TaskCard
// ----------------------------------------------------------------------------

interface TaskCardProps {
  task: Task;
  index: number;
  /** Қызметкерлер тізімі (бекіту мәзірі үшін) */
  staffList: Staff[];
  /** 3-нүкте мәзірін көрсету керек пе (тек апта күндерінде) */
  showMenu: boolean;
  /** Тапсырманы жылжытуға тыйым салынды ма (қызметкер көрінісі) */
  dragDisabled?: boolean;
  /** Тапсырманы қызметкерге бекіту */
  onAssign: (taskId: string, staffId: string | null) => void;
  /** Тапсырма күйін өзгерту (берілсе — "Орындалды" ауыстырғышы көрінеді) */
  onSetStatus?: (taskId: string, status: TaskStatus) => void;
}

export default function TaskCard({
  task,
  index,
  staffList,
  showMenu,
  dragDisabled = false,
  onAssign,
  onSetStatus,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Мәзірден тыс жерді басқанда жабу
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const assignedStaff = task.assigned_to
    ? staffList.find((s) => s.id === task.assigned_to) ?? null
    : null;

  return (
    <Draggable
      draggableId={task.id}
      index={index}
      isDragDisabled={dragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={[
            "group relative select-none rounded-xl border bg-white p-3 shadow-sm transition",
            "border-slate-200",
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-indigo-300 rotate-[0.5deg]"
              : "hover:shadow-md",
            dragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          ].join(" ")}
        >
          {/* Жоғарғы қатар: түр белгісі + 3 нүкте */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                TYPE_BADGE[task.type],
              ].join(" ")}
            >
              {TYPE_LABEL[task.type]}
            </span>

            {showMenu && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Тапсырма мәзірі"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {/* Үш нүкте иконкасы */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="4" r="1.6" />
                    <circle cx="10" cy="10" r="1.6" />
                    <circle cx="10" cy="16" r="1.6" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-8 z-30 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Орынбасарға бекіту
                    </p>
                    {staffList.map((staff) => {
                      const active = staff.id === task.assigned_to;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            onAssign(task.id, staff.id);
                            setMenuOpen(false);
                          }}
                          className={[
                            "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-indigo-50",
                            active ? "bg-indigo-50" : "",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              active ? "bg-indigo-500" : "bg-slate-300",
                            ].join(" ")}
                          />
                          <span>
                            <span className="block font-medium text-slate-800">
                              {staff.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {staff.role}
                            </span>
                          </span>
                        </button>
                      );
                    })}

                    {task.assigned_to && (
                      <>
                        <div className="my-1 h-px bg-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            onAssign(task.id, null);
                            setMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                        >
                          Бекітуді алып тастау
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Тапсырма атауы */}
          <p className="text-sm font-medium leading-snug text-slate-800">
            {task.title}
          </p>

          {/* Төменгі қатар: күй + бекітілген қызметкер */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {onSetStatus ? (
              // Интерактивті "Орындалды" ауыстырғышы (директор әрі орындаушы)
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetStatus(
                    task.id,
                    task.status === "done" ? "pending" : "done"
                  );
                }}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition",
                  task.status === "done"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    task.status === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-400 bg-white",
                  ].join(" ")}
                >
                  {task.status === "done" && (
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {task.status === "done" ? "Аяқталды" : "Орындалды деп белгілеу"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[task.status]}`} />
                {STATUS_LABEL[task.status]}
              </span>
            )}

            {assignedStaff && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-6 2-6 4.5V18h12v-1.5C16 14 13.3 12 10 12z" />
                </svg>
                {assignedStaff.name}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
