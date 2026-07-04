import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail, serializeTask } from "@/lib/api";
import { ALL_COLUMN_IDS, TASK_TYPES } from "@/lib/constants";

/** Апта бойынша тапсырмаларды алу (директор — бәрін, қызметкер — тек өзінікін) */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (!me.schoolId) return fail("Мектеп тағайындалмаған", 403);

  const weekKey = new URL(req.url).searchParams.get("weekKey");
  if (!weekKey) return fail("weekKey қажет");

  const where =
    me.role === "director"
      ? { schoolId: me.schoolId, weekKey }
      : { schoolId: me.schoolId, weekKey, assignedToId: me.id };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { orderIndex: "asc" },
  });

  return ok({ tasks: tasks.map(serializeTask) });
}

/** Жаңа тапсырма қосу (директор — еркін, қызметкер — тек өзіне) */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (!me.schoolId) return fail("Мектеп тағайындалмаған", 403);

  const body = await req.json().catch(() => null);
  const title = (body?.title ?? "").trim();
  const type = TASK_TYPES.includes(body?.type) ? body.type : "minor";
  const weekKey = (body?.weekKey ?? "").trim();
  let columnId = (body?.columnId ?? "unassigned").trim();
  if (!ALL_COLUMN_IDS.includes(columnId)) columnId = "unassigned";

  if (!title) return fail("Тапсырма атауын енгізіңіз");
  if (!weekKey) return fail("Апта көрсетілмеген");

  let assignedToId: string | null = null;
  if (me.role === "director") {
    assignedToId = (body?.assignedToId ?? "").trim() || null;
  } else {
    // Қызметкер тек өзіне қосады және жоғарғы контейнерге қоя алмайды
    assignedToId = me.id;
    if (columnId === "unassigned") columnId = "monday";
  }

  // Бағанның соңына қою үшін орын индексін есептейміз
  const last = await prisma.task.findFirst({
    where: { schoolId: me.schoolId, weekKey, columnId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });
  const orderIndex = (last?.orderIndex ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      schoolId: me.schoolId,
      title,
      type,
      weekKey,
      columnId,
      orderIndex,
      assignedToId,
      originWeek: 0,
    },
  });

  return ok({ task: serializeTask(task) }, 201);
}
