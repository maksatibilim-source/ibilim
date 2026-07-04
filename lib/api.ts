// Серверлік API үшін ортақ жауап көмекшілері
import { NextResponse } from "next/server";
import type { Task as DbTask } from "@prisma/client";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Дерекқор тапсырмасын клиентке жіберілетін пішінге айналдыру */
export interface ApiTask {
  id: string;
  title: string;
  type: string;
  status: string;
  assigned_to: string | null;
  original_week: number;
  columnId: string;
  orderIndex: number;
  weekKey: string;
}

export function serializeTask(t: DbTask): ApiTask {
  return {
    id: t.id,
    title: t.title,
    type: t.type,
    status: t.status,
    assigned_to: t.assignedToId,
    original_week: t.originWeek ?? 0,
    columnId: t.columnId,
    orderIndex: t.orderIndex,
    weekKey: t.weekKey,
  };
}
