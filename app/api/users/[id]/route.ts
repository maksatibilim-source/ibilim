import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";

interface Ctx {
  params: { id: string };
}

/** Қолданушыны жаңарту (рөл, лауазым, аты, құпия сөз) */
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return fail("Қолданушы табылмады", 404);

  const isAdmin = me.role === "admin" && target.role === "director";
  const isOwnDirector =
    me.role === "director" &&
    me.schoolId === target.schoolId &&
    STAFF_ROLES.includes(target.role as never);
  if (!isAdmin && !isOwnDirector) return fail("Рұқсат жоқ", 403);

  const body = await req.json().catch(() => null);
  const data: Record<string, string> = {};

  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.position === "string") data.position = body.position.trim();
  if (typeof body?.password === "string" && body.password.length >= 4) {
    data.passwordHash = await hashPassword(body.password);
  }
  // Логинді (username) өзгерту — бірегейлігін тексереміз
  if (typeof body?.username === "string" && body.username.trim()) {
    const nextUsername = body.username.trim().toLowerCase();
    if (nextUsername !== target.username) {
      const clash = await prisma.user.findUnique({ where: { username: nextUsername } });
      if (clash) return fail("Мұндай пайдаланушы аты бұрыннан бар", 409);
      data.username = nextUsername;
    }
  }
  // Директор қызметкер рөлін STAFF_ROLES ішінде өзгерте алады
  if (isOwnDirector && typeof body?.role === "string") {
    if (!STAFF_ROLES.includes(body.role as never)) return fail("Рөл жарамсыз");
    data.role = body.role;
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, username: true, role: true, position: true, schoolId: true },
  });
  return ok({ user });
}

/** Қолданушыны жою */
export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await getCurrentUser();
  if (!me) return fail("Кіру қажет", 401);
  if (me.id === params.id) return fail("Өзіңізді жоя алмайсыз", 400);

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return fail("Қолданушы табылмады", 404);

  const isAdmin = me.role === "admin" && target.role === "director";
  const isOwnDirector =
    me.role === "director" &&
    me.schoolId === target.schoolId &&
    STAFF_ROLES.includes(target.role as never);
  if (!isAdmin && !isOwnDirector) return fail("Рұқсат жоқ", 403);

  await prisma.user.delete({ where: { id: params.id } });
  return ok({ success: true });
}
