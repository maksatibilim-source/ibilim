import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { getMonday, weekKey } from "@/lib/dates";

interface Ctx {
  params: { id: string };
}

/** Мектепті жаңарту: admin — бәрін, директор — тек өз мектебінің Sheets сілтемесін */
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);

  const isAdmin = me.role === "admin";
  const isOwnDirector = me.role === "director" && me.schoolId === params.id;
  if (!isAdmin && !isOwnDirector) return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const data: Record<string, string | null> = {};

  if (typeof body?.sheetUrl === "string") data.sheetUrl = body.sheetUrl.trim() || null;
  if (typeof body?.sheetRange === "string") data.sheetRange = body.sheetRange.trim() || null;
  // Оқу жылының басын әрдайым дүйсенбіге келтіріп сақтаймыз
  if (typeof body?.sheetYearStart === "string") {
    const raw = body.sheetYearStart.trim();
    data.sheetYearStart = raw ? weekKey(getMonday(new Date(raw))) : null;
  }
  // Атауын тек admin өзгерте алады
  if (isAdmin && typeof body?.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }

  const school = await prisma.school.update({ where: { id: params.id }, data });
  return ok({ school });
}

/** Мектепті жою (тек admin) — қолданушылар мен тапсырмалар да жойылады (cascade) */
export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "admin") return fail("Рұқсат жоқ", 403);

  await prisma.school.delete({ where: { id: params.id } });
  return ok({ success: true });
}
