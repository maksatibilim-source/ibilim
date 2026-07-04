import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";

/**
 * Директорға арналған командалық статистика (dashboard).
 * Әр қызметкердің тапсырмалары күйі бойынша есептеледі (барлық апталар).
 * ?weekKey=... берілсе — тек сол апта бойынша.
 */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "director" || !me.schoolId) return fail("Рұқсат жоқ", 403);

  const weekKey = new URL(req.url).searchParams.get("weekKey");
  const taskWhere = weekKey
    ? { schoolId: me.schoolId, weekKey }
    : { schoolId: me.schoolId };

  const [users, tasks] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId: me.schoolId, role: { in: STAFF_ROLES } },
      select: { id: true, name: true, position: true, role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: taskWhere,
      select: { assignedToId: true, status: true },
    }),
  ]);

  type Counts = { total: number; done: number; in_progress: number; pending: number };
  const zero = (): Counts => ({ total: 0, done: 0, in_progress: 0, pending: 0 });

  const byUser = new Map<string, Counts>();
  for (const u of users) byUser.set(u.id, zero());
  const totals = zero();
  let unassigned = 0;

  for (const t of tasks) {
    totals.total++;
    if (t.status === "done") totals.done++;
    else if (t.status === "in_progress") totals.in_progress++;
    else totals.pending++;

    if (t.assignedToId && byUser.has(t.assignedToId)) {
      const c = byUser.get(t.assignedToId)!;
      c.total++;
      if (t.status === "done") c.done++;
      else if (t.status === "in_progress") c.in_progress++;
      else c.pending++;
    } else if (!t.assignedToId) {
      unassigned++;
    }
  }

  const staff = users.map((u) => ({
    id: u.id,
    name: u.name,
    position: u.position,
    role: u.role,
    ...byUser.get(u.id)!,
  }));

  return ok({ staff, totals: { ...totals, unassigned } });
}
