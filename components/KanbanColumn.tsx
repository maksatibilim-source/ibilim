"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Column, Staff, Task, TaskStatus } from "@/lib/types";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  column: Column;
  /** Осы бағандағы тапсырмалар (реті taskIds бойынша) */
  tasks: Task[];
  staffList: Staff[];
  /** Карточкаларда 3-нүкте мәзірін көрсету (тек апта күндерінде) */
  showMenu: boolean;
  /** Жылжытуға тыйым (қызметкер көрінісі) */
  dragDisabled?: boolean;
  /** Ерекшелеу түсі (баған тақырыбының жолағы) */
  accentClass?: string;
  /** Баған тақырыбының астындағы күні (мыс. "04.07.2026") */
  subtitle?: string;
  onAssign: (taskId: string, staffId: string | null) => void;
  onSetStatus?: (taskId: string, status: TaskStatus) => void;
}

export default function KanbanColumn({
  column,
  tasks,
  staffList,
  showMenu,
  dragDisabled = false,
  accentClass = "bg-slate-200 text-slate-700",
  subtitle,
  onAssign,
  onSetStatus,
}: KanbanColumnProps) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/70">
      {/* Баған тақырыбы */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-700">
            {column.title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <span
          className={[
            "ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold",
            accentClass,
          ].join(" ")}
        >
          {tasks.length}
        </span>
      </div>

      {/* Тапсырмалар аймағы (droppable) */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "thin-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-2xl px-2 pb-3 pt-1 transition-colors",
              "min-h-[120px]",
              snapshot.isDraggingOver ? "bg-indigo-50/80" : "bg-transparent",
            ].join(" ")}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                staffList={staffList}
                showMenu={showMenu}
                dragDisabled={dragDisabled}
                onAssign={onAssign}
                onSetStatus={onSetStatus}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                Тапсырманы осында сүйреңіз
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
