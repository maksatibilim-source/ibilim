// ApiTask тізімінен клиенттік BoardState құрастыру (таза функция, серверсіз)
import type {
  ApiTask,
  BoardState,
  Column,
  ColumnId,
  Task,
  TaskStatus,
  TaskType,
} from "./types";
import { ALL_COLUMN_IDS, COLUMN_TITLES, GRID_COLUMN_ORDER } from "./constants";

function toTask(t: ApiTask): Task {
  return {
    id: t.id,
    title: t.title,
    type: t.type as TaskType,
    original_week: t.original_week,
    assigned_to: t.assigned_to,
    status: t.status as TaskStatus,
  };
}

/** ApiTask[] → BoardState (бағандар бойынша топтастырып, ретімен) */
export function buildBoard(tasks: ApiTask[]): BoardState {
  const taskMap: Record<string, Task> = {};
  const columns = {} as Record<ColumnId, Column>;
  for (const id of ALL_COLUMN_IDS) {
    columns[id] = { id, title: COLUMN_TITLES[id], taskIds: [] };
  }

  const sorted = [...tasks].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const t of sorted) {
    taskMap[t.id] = toTask(t);
    const colId = (ALL_COLUMN_IDS as string[]).includes(t.columnId)
      ? (t.columnId as ColumnId)
      : "unassigned";
    columns[colId].taskIds.push(t.id);
  }

  return { tasks: taskMap, columns, columnOrder: GRID_COLUMN_ORDER };
}
