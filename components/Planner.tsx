"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";

import type {
  ApiTask,
  AuthUser,
  BoardState,
  ColumnId,
  ManagedUser,
  Staff,
} from "@/lib/types";
import { api } from "@/lib/client";
import { buildBoard } from "@/lib/board";
import {
  addDays,
  formatDate,
  getCurrentWeekKey,
  keyToDate,
  weekKey,
} from "@/lib/dates";

import type { TaskStatus } from "@/lib/types";
import AppHeader from "./AppHeader";
import DashboardGrid from "./DashboardGrid";
import UnassignedContainer from "./UnassignedContainer";
import AddTaskModal, { type NewTaskInput } from "./AddTaskModal";
import StaffManager from "./StaffManager";
import TeamDashboard from "./TeamDashboard";

interface PlannerProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function Planner({ user, onLogout }: PlannerProps) {
  const isDirector = user.role === "director";

  const [weekKeyState, setWeekKeyState] = useState<string>(getCurrentWeekKey());
  const [board, setBoard] = useState<BoardState>(() => buildBoard([]));
  const [staff, setStaff] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);

  const weekStart = useMemo(() => keyToDate(weekKeyState), [weekKeyState]);
  const isCurrentWeek = weekKeyState === getCurrentWeekKey();

  // Тапсырма бекітуге болатын қызметкерлер (Staff пішіні: role = лауазым)
  const staffList: Staff[] = useMemo(
    () => staff.map((s) => ({ id: s.id, name: s.name, role: s.position })),
    [staff]
  );

  // Таңдалған аптаның тапсырмаларын жүктеу
  const loadWeek = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const { tasks } = await api.get<{ tasks: ApiTask[] }>(
        `/api/tasks?weekKey=${key}`
      );
      setBoard(buildBoard(tasks));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Жүктеу қатесі");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeek(weekKeyState);
  }, [weekKeyState, loadWeek]);

  // Директор — қызметкерлер тізімін бір рет жүктейді (бекіту үшін)
  useEffect(() => {
    if (!isDirector) return;
    api
      .get<{ users: ManagedUser[] }>("/api/users")
      .then(({ users }) => setStaff(users))
      .catch(() => {});
  }, [isDirector]);

  // --------------------------------------------------------------------------
  //  Апта навигациясы
  // --------------------------------------------------------------------------
  const goToWeek = (offset: number) =>
    setWeekKeyState((k) => weekKey(addDays(keyToDate(k), offset * 7)));
  const goToCurrentWeek = () => setWeekKeyState(getCurrentWeekKey());

  // --------------------------------------------------------------------------
  //  Реттелген бағанды серверде сақтау
  // --------------------------------------------------------------------------
  async function persistColumns(next: BoardState, columnIds: ColumnId[]) {
    const columns: Record<string, string[]> = {};
    for (const id of columnIds) columns[id] = next.columns[id].taskIds;
    try {
      await api.post("/api/tasks/reorder", { weekKey: weekKeyState, columns });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сақтау қатесі");
    }
  }

  // --------------------------------------------------------------------------
  //  Drag-and-drop
  // --------------------------------------------------------------------------
  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Келесі аптаға өткізу — тапсырма келесі аптаның unassigned блогына көшеді
    if (destination.droppableId === "next_week") {
      rolloverToNextWeek(source.droppableId as ColumnId, draggableId);
      return;
    }

    const start = board.columns[source.droppableId as ColumnId];
    const finish = board.columns[destination.droppableId as ColumnId];
    let next: BoardState;

    if (start.id === finish.id) {
      const ids = Array.from(start.taskIds);
      ids.splice(source.index, 1);
      ids.splice(destination.index, 0, draggableId);
      next = {
        ...board,
        columns: { ...board.columns, [start.id]: { ...start, taskIds: ids } },
      };
    } else {
      const startIds = Array.from(start.taskIds);
      startIds.splice(source.index, 1);
      const finishIds = Array.from(finish.taskIds);
      finishIds.splice(destination.index, 0, draggableId);
      next = {
        ...board,
        columns: {
          ...board.columns,
          [start.id]: { ...start, taskIds: startIds },
          [finish.id]: { ...finish, taskIds: finishIds },
        },
      };
    }

    setBoard(next); // оптимистік жаңарту
    persistColumns(next, [start.id, finish.id]);
  }

  // Келесі аптаға өткізу
  function rolloverToNextWeek(sourceColId: ColumnId, taskId: string) {
    const nextKey = weekKey(addDays(keyToDate(weekKeyState), 7));
    const srcCol = board.columns[sourceColId];

    // Локальді түрде ағымдағы аптадан алып тастаймыз
    const nextTasks = { ...board.tasks };
    delete nextTasks[taskId];
    const next: BoardState = {
      ...board,
      tasks: nextTasks,
      columns: {
        ...board.columns,
        [sourceColId]: {
          ...srcCol,
          taskIds: srcCol.taskIds.filter((id) => id !== taskId),
        },
      },
    };
    setBoard(next);

    // orderIndex-ті сервер есептейді (мақсатты аптаның соңына қосады)
    api
      .patch(`/api/tasks/${taskId}`, {
        weekKey: nextKey,
        columnId: "unassigned",
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Қате"));
  }

  // --------------------------------------------------------------------------
  //  Бекіту
  // --------------------------------------------------------------------------
  function handleAssign(taskId: string, staffId: string | null) {
    setBoard((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: { ...prev.tasks[taskId], assigned_to: staffId },
      },
    }));
    api
      .patch(`/api/tasks/${taskId}`, { assignedToId: staffId })
      .catch((e) => setError(e instanceof Error ? e.message : "Қате"));
  }

  // Тапсырма күйін өзгерту (директор әрі бекітілген орындаушы)
  function handleSetStatus(taskId: string, status: TaskStatus) {
    setBoard((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: { ...prev.tasks[taskId], status },
      },
    }));
    api
      .patch(`/api/tasks/${taskId}`, { status })
      .catch((e) => setError(e instanceof Error ? e.message : "Қате"));
  }

  // --------------------------------------------------------------------------
  //  Жаңа тапсырма қосу
  // --------------------------------------------------------------------------
  async function handleAddTask(input: NewTaskInput) {
    try {
      await api.post("/api/tasks", {
        title: input.title,
        type: input.type,
        weekKey: weekKeyState,
        columnId: input.targetColumn,
        assignedToId: input.assignedTo,
      });
      loadWeek(weekKeyState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Қате");
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 lg:px-8">
        <AppHeader user={user} onLogout={onLogout}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Тапсырма қосу
          </button>

          {isDirector && (
            <>
              <button
                type="button"
                onClick={() => setDashOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 3h6v8H3V3zm8 0h6v4h-6V3zM3 13h6v4H3v-4zm8-4h6v8h-6V9z" />
                </svg>
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => setStaffOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13 8a3 3 0 10-6 0 3 3 0 006 0zm-9 8c0-2.2 2.7-4 6-4s6 1.8 6 4v1H4v-1z" />
                </svg>
                Қызметкерлер
              </button>
            </>
          )}
        </AppHeader>

        {/* Апта таңдағыш */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToWeek(-1)}
              aria-label="Алдыңғы апта"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4L7 10l5.5 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="min-w-[210px] text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Таңдалған апта
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {formatDate(weekStart)} — {formatDate(addDays(weekStart, 4))}
              </p>
            </div>

            <button
              type="button"
              onClick={() => goToWeek(1)}
              aria-label="Келесі апта"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7.5 4L13 10l-5.5 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {isCurrentWeek ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ағымдағы апта
            </span>
          ) : (
            <button
              type="button"
              onClick={goToCurrentWeek}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Ағымдағы аптаға оралу
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {!isDirector && (
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
            <span className="font-semibold">{user.name}</span> ({user.position}) —
            сізге бекітілген тапсырмалар ғана көрсетілген.
          </div>
        )}

        {/* Жоғарғы аймақ (тек директор) */}
        {isDirector && (
          <div className="mb-6">
            <UnassignedContainer
              column={board.columns.unassigned}
              tasks={board.columns.unassigned.taskIds.map((id) => board.tasks[id])}
              staffList={staffList}
              onAssign={handleAssign}
            />
          </div>
        )}

        {/* Жоспарлаушы тор */}
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Жүктелуде...</p>
        ) : (
          <DashboardGrid
            board={board}
            staffList={staffList}
            weekStart={weekStart}
            dragDisabled={!isDirector}
            onAssign={handleAssign}
            onSetStatus={handleSetStatus}
          />
        )}
      </div>

      {/* Модальдер */}
      <AddTaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddTask}
        staffList={staffList}
        role={isDirector ? "principal" : "staff"}
        activeStaffId={user.id}
      />

      {isDirector && (
        <>
          <StaffManager
            open={staffOpen}
            onClose={() => setStaffOpen(false)}
            onChanged={setStaff}
          />
          <TeamDashboard open={dashOpen} onClose={() => setDashOpen(false)} />
        </>
      )}
    </DragDropContext>
  );
}
