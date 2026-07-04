"use client";

import type { BoardState, ColumnId, Staff, TaskStatus } from "@/lib/types";
import { addDays, formatDate } from "@/lib/dates";
import KanbanColumn from "./KanbanColumn";

/** Әр бағанға ерекше түс (санауыш белгісі) */
const ACCENTS: Record<ColumnId, string> = {
  unassigned: "bg-slate-200 text-slate-700",
  monday: "bg-indigo-100 text-indigo-700",
  tuesday: "bg-sky-100 text-sky-700",
  wednesday: "bg-emerald-100 text-emerald-700",
  thursday: "bg-violet-100 text-violet-700",
  friday: "bg-teal-100 text-teal-700",
  next_week: "bg-amber-100 text-amber-700",
};

/** Апта күндерінің дүйсенбіден жылжуы (күнін есептеу үшін) */
const WEEKDAY_OFFSET: Partial<Record<ColumnId, number>> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
};

interface DashboardGridProps {
  board: BoardState;
  staffList: Staff[];
  /** Таңдалған аптаның дүйсенбісі (күндерді есептеу үшін) */
  weekStart: Date;
  /** Қызметкер көрінісінде жылжыту мен мәзір өшіріледі */
  dragDisabled?: boolean;
  onAssign: (taskId: string, staffId: string | null) => void;
  onSetStatus?: (taskId: string, status: TaskStatus) => void;
}

/**
 * Төменгі аймақ — 6 бағаннан тұратын апталық жоспарлаушы тор
 * (5 күн + "Келесі аптаға өткізу").
 */
export default function DashboardGrid({
  board,
  staffList,
  weekStart,
  dragDisabled = false,
  onAssign,
  onSetStatus,
}: DashboardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {board.columnOrder.map((columnId) => {
        const column = board.columns[columnId];
        const tasks = column.taskIds.map((id) => board.tasks[id]);
        const isNextWeek = columnId === "next_week";

        // Апта күні болса — нақты күнін есептейміз (мыс. "04.07.2026").
        // "Келесі аптаға өткізу" бағаны үшін — келесі аптаның басталу күні.
        const offset = WEEKDAY_OFFSET[columnId];
        const subtitle =
          offset !== undefined
            ? formatDate(addDays(weekStart, offset))
            : isNextWeek
              ? `→ ${formatDate(addDays(weekStart, 7))} аптасы`
              : undefined;

        return (
          <div
            key={columnId}
            className={[
              "min-h-[380px]",
              isNextWeek
                ? "rounded-2xl ring-1 ring-amber-200/60"
                : "",
            ].join(" ")}
          >
            <KanbanColumn
              column={column}
              tasks={tasks}
              staffList={staffList}
              subtitle={subtitle}
              // 3-нүкте мәзірі "Келесі аптаға өткізу" бағанынан басқа
              // барлық апта күндерінде көрінеді
              showMenu={!dragDisabled && !isNextWeek}
              dragDisabled={dragDisabled}
              accentClass={ACCENTS[columnId]}
              onAssign={onAssign}
              onSetStatus={onSetStatus}
            />
          </div>
        );
      })}
    </div>
  );
}
