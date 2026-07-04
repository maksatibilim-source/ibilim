import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { ALL_COLUMN_IDS } from "@/lib/constants";

/**
 * Сүйреуден кейінгі жаңа ретті сақтау.
 * Body: { weekKey, columns: { [columnId]: string[] } }
 * Әр бағандағы тапсырмаларға columnId + orderIndex орнатылады.
 */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "director" || !me.schoolId) return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const weekKey = (body?.weekKey ?? "").trim();
  const columns = body?.columns as Record<string, string[]> | undefined;
  if (!weekKey || !columns || typeof columns !== "object") {
    return fail("Деректер жарамсыз");
  }

  // Тек осы мектеп пен аптаға тиесілі тапсырмаларды жаңартамыз
  const owned = await prisma.task.findMany({
    where: { schoolId: me.schoolId, weekKey },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((t) => t.id));

  const updates: { id: string; columnId: string; orderIndex: number }[] = [];
  for (const [columnId, ids] of Object.entries(columns)) {
    if (!(ALL_COLUMN_IDS as string[]).includes(columnId)) continue;
    ids.forEach((id, index) => {
      if (ownedIds.has(id)) updates.push({ id, columnId, orderIndex: index });
    });
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.task.update({
        where: { id: u.id },
        data: { columnId: u.columnId, orderIndex: u.orderIndex },
      })
    )
  );

  return ok({ success: true, updated: updates.length });
}
