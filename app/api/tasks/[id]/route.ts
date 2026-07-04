import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail, serializeTask } from "@/lib/api";
import { ALL_COLUMN_IDS, TASK_STATUSES } from "@/lib/constants";

interface Ctx {
  params: { id: string };
}

/** Тапсырманы жаңарту: жылжыту, бекіту, күйін өзгерту, келесі аптаға өткізу */
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (!me.schoolId) return fail("Рұқсат жоқ", 403);

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.schoolId !== me.schoolId) return fail("Тапсырма табылмады", 404);

  const isDirector = me.role === "director";
  const isAssignee = task.assignedToId === me.id;
  // Директор — бәрін; тапсырма бекітілген қызметкер — тек статусты
  if (!isDirector && !isAssignee) return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const data: Record<string, string | number | null> = {};

  // Статусты директор де, бекітілген орындаушы да өзгерте алады
  if (typeof body?.status === "string" && TASK_STATUSES.includes(body.status)) {
    data.status = body.status;
  }

  // Қалған өрістерді тек директор өзгерте алады
  if (isDirector) {
    if (typeof body?.columnId === "string" && ALL_COLUMN_IDS.includes(body.columnId)) {
      data.columnId = body.columnId;
    }
    if (typeof body?.weekKey === "string" && body.weekKey.trim()) {
      data.weekKey = body.weekKey.trim();
    }
    // orderIndex тек жарамды 32 биттік бүтін болса қабылданады
    // (әйтпесе — ескі клиенттен келген үлкен санды елемей, өзіміз есептейміз)
    const MAX_INT = 2147483647;
    const validOrder =
      typeof body?.orderIndex === "number" &&
      Number.isInteger(body.orderIndex) &&
      body.orderIndex >= 0 &&
      body.orderIndex <= MAX_INT;

    if (validOrder) {
      data.orderIndex = body.orderIndex;
    } else if (data.weekKey !== undefined || data.columnId !== undefined) {
      // Басқа аптаға/бағанға көшкенде — мақсаттың соңына қосамыз
      const targetWeek = (data.weekKey as string) ?? task.weekKey;
      const targetCol = (data.columnId as string) ?? task.columnId;
      const last = await prisma.task.findFirst({
        where: {
          schoolId: me.schoolId,
          weekKey: targetWeek,
          columnId: targetCol,
          id: { not: task.id },
        },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      data.orderIndex = (last?.orderIndex ?? -1) + 1;
    }
    // assignedToId: null болса — бекітуді алып тастау
    if ("assignedToId" in (body ?? {})) {
      data.assignedToId = body.assignedToId || null;
    }
  }

  const updated = await prisma.task.update({ where: { id: params.id }, data });
  return ok({ task: serializeTask(updated) });
}

/** Тапсырманы жою (тек өз мектебінің директоры) */
export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "director" || !me.schoolId) return fail("Рұқсат жоқ", 403);

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.schoolId !== me.schoolId) return fail("Тапсырма табылмады", 404);

  await prisma.task.delete({ where: { id: params.id } });
  return ok({ success: true });
}
