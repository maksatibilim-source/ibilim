import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

/** Барлық мектептерді тізімдеу (тек admin) */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "admin") return fail("Рұқсат жоқ", 403);

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "director" },
        select: { id: true, name: true, username: true },
      },
      _count: { select: { users: true, tasks: true } },
    },
  });

  return ok({ schools });
}

/** Жаңа мектеп ашу (тек admin) */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.role !== "admin") return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  if (!name) return fail("Мектеп атауын енгізіңіз");

  const school = await prisma.school.create({
    data: {
      name,
      sheetUrl: (body?.sheetUrl ?? "").trim() || null,
      sheetRange: (body?.sheetRange ?? "").trim() || null,
    },
  });

  return ok({ school }, 201);
}
