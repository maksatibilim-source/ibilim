import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";

const userSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  position: true,
  schoolId: true,
} as const;

/**
 * Қолданушыларды тізімдеу.
 *  - admin: барлық директорлар (немесе ?schoolId=... берілсе — сол мектеп қызметкерлері)
 *  - director: өз мектебінің қызметкерлері (директордан басқа)
 */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);

  if (me.role === "admin") {
    const schoolId = new URL(req.url).searchParams.get("schoolId");
    const users = await prisma.user.findMany({
      where: schoolId ? { schoolId } : { role: "director" },
      select: userSelect,
      orderBy: { createdAt: "asc" },
    });
    return ok({ users });
  }

  if (me.role === "director" && me.schoolId) {
    const users = await prisma.user.findMany({
      where: { schoolId: me.schoolId, role: { in: STAFF_ROLES } },
      select: userSelect,
      orderBy: { createdAt: "asc" },
    });
    return ok({ users });
  }

  return fail("Рұқсат жоқ", 403);
}

/**
 * Жаңа қолданушы жасау.
 *  - admin: мектепке директор тағайындайды (role='director', schoolId міндетті)
 *  - director: өз мектебіне қызметкер қосады (STAFF_ROLES ішінен)
 */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").trim();
  const username = (body?.username ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  const position = (body?.position ?? "").trim();

  if (!name) return fail("Аты-жөнін енгізіңіз");
  if (!username) return fail("Пайдаланушы атын енгізіңіз");
  if (!password || password.length < 4) return fail("Құпия сөз кемінде 4 таңба болсын");

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return fail("Мұндай пайдаланушы аты бұрыннан бар", 409);

  let role: string;
  let schoolId: string | null;

  if (me.role === "admin") {
    role = "director";
    schoolId = (body?.schoolId ?? "").trim() || null;
    if (!schoolId) return fail("Мектепті таңдаңыз");
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return fail("Мектеп табылмады", 404);
  } else if (me.role === "director" && me.schoolId) {
    role = body?.role ?? "";
    if (!STAFF_ROLES.includes(role as never)) return fail("Рөл жарамсыз");
    schoolId = me.schoolId;
  } else {
    return fail("Рұқсат жоқ", 403);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role,
      position: position || (role === "director" ? "Мектеп директоры" : ""),
      schoolId,
    },
    select: userSelect,
  });

  return ok({ user }, 201);
}
