import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { fetchAnnualPlan } from "@/lib/sheets";
import { getMonday, weekKey } from "@/lib/dates";

const DEFAULT_YEAR_START = "2026-08-03"; // 1-аптаның дүйсенбісі (әдепкі)

/**
 * Google Sheets-тен жылдық жоспарды импорттау (тек admin).
 * Body: { schoolId }
 * Әр жол — бір апта; тапсырмалар өз аптасының "unassigned" блогына түседі.
 * Апта нөмірі мектептің sheetYearStart күнінен нақты күнге айналады.
 */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "admin") return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const schoolId = (body?.schoolId ?? "").trim();
  if (!schoolId) return fail("Мектеп таңдалмаған");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return fail("Мектеп табылмады", 404);
  if (!school.sheetUrl) {
    return fail("Мектепке Google Sheets сілтемесі салынбаған.");
  }

  // Оқу жылының басын нақты дүйсенбіге келтіреміз (навигация дүйсенбі-негізді)
  const yearStartKey = weekKey(
    getMonday(new Date(school.sheetYearStart || DEFAULT_YEAR_START))
  );

  let items;
  try {
    items = await fetchAnnualPlan(school.sheetUrl, school.sheetRange, yearStartKey);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Импорт қатесі", 502);
  }

  if (items.length === 0) {
    return fail("Көрсетілген диапазоннан тапсырма табылмады.");
  }

  // Апта бойынша топтастыру
  const byWeek = new Map<string, { title: string; weekNumber: number }[]>();
  for (const item of items) {
    const list = byWeek.get(item.weekKey) ?? [];
    list.push({ title: item.title, weekNumber: item.weekNumber });
    byWeek.set(item.weekKey, list);
  }

  // Қайталауды болдырмау: бар тапсырмалардың (апта + атау) кілттерін жинаймыз.
  // Кілт барлық бағандарды қамтиды — директор жоспарлаған тапсырма қайта қосылмайды.
  const existing = await prisma.task.findMany({
    where: { schoolId },
    select: { weekKey: true, title: true },
  });
  const dedupKey = (wk: string, title: string) =>
    `${wk}||${title.trim().toLowerCase()}`;
  const seen = new Set(existing.map((t) => dedupKey(t.weekKey, t.title)));

  // Әр аптаның unassigned блогына соңынан жалғап қосамыз
  const data: {
    schoolId: string;
    title: string;
    type: string;
    weekKey: string;
    columnId: string;
    orderIndex: number;
    originWeek: number;
  }[] = [];
  let skipped = 0;

  for (const [wk, list] of byWeek) {
    const last = await prisma.task.findFirst({
      where: { schoolId, weekKey: wk, columnId: "unassigned" },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    let order = (last?.orderIndex ?? -1) + 1;
    for (const t of list) {
      const key = dedupKey(wk, t.title);
      if (seen.has(key)) {
        skipped++; // бұрыннан бар — өткіземіз
        continue;
      }
      seen.add(key);
      data.push({
        schoolId,
        title: t.title,
        type: "minor",
        weekKey: wk,
        columnId: "unassigned",
        orderIndex: order++,
        originWeek: t.weekNumber,
      });
    }
  }

  if (data.length > 0) await prisma.task.createMany({ data });

  return ok({
    imported: data.length,
    skipped,
    weeks: byWeek.size,
    firstWeekKey: yearStartKey,
  });
}
