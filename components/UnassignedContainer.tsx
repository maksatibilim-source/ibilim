"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Column, Staff, Task } from "@/lib/types";
import TaskCard from "./TaskCard";

interface UnassignedContainerProps {
  column: Column;
  tasks: Task[];
  staffList: Staff[];
  onAssign: (taskId: string, staffId: string | null) => void;
}

/**
 * Жоғарғы аймақ — "Жылдық жоспардан келген тапсырмалар".
 * Көлденең айналдырылатын (horizontal) droppable контейнер.
 */
export default function UnassignedContainer({
  column,
  tasks,
  staffList,
  onAssign,
}: UnassignedContainerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm2 3v2h8V6H6zm0 4v2h8v-2H6z" />
          </svg>
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{column.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Тапсырманы төмендегі апта күндеріне сүйреп апарыңыз
          </p>
        </div>
        <span className="ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={column.id} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "thin-scrollbar flex gap-3 overflow-x-auto rounded-xl p-2 transition-colors",
              "min-h-[130px]",
              snapshot.isDraggingOver
                ? "bg-indigo-50 dark:bg-indigo-950/30"
                : "bg-slate-50 dark:bg-slate-800/40",
            ].join(" ")}
          >
            {tasks.map((task, index) => (
              <div key={task.id} className="w-64 shrink-0">
                <TaskCard
                  task={task}
                  index={index}
                  staffList={staffList}
                  showMenu={false}
                  onAssign={onAssign}
                />
              </div>
            ))}
            {provided.placeholder}

            {tasks.length === 0 && (
              <div className="flex w-full items-center justify-center text-sm text-slate-400">
                Барлық тапсырма аптаға бөлінді 🎉
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
