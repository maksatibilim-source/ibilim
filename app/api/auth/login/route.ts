import { prisma } from "@/lib/db";
import { createSession, verifyPassword, getCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (!username || !password) {
    return fail("Пайдаланушы аты мен құпия сөзді енгізіңіз");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("Пайдаланушы аты немесе құпия сөз қате", 401);
  }

  await createSession(user.id);
  const safe = await getCurrentUser();
  return ok({ user: safe });
}
