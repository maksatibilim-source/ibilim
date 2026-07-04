// ============================================================================
//  Серверлік аутентификация: құпия сөзді хэштеу, сессия cookie, ағымдағы қолданушы
//  (Тек серверде қолданылады — Route Handler / Server Component)
// ============================================================================

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const SESSION_COOKIE = "sm_session";
const SESSION_DAYS = 30;

/** Клиентке қауіпсіз жіберуге болатын қолданушы (passwordHash-сыз) */
export interface SafeUser {
  id: string;
  name: string;
  username: string;
  role: string;
  position: string;
  schoolId: string | null;
  school: {
    id: string;
    name: string;
    sheetUrl: string | null;
    sheetRange: string | null;
    sheetYearStart: string | null;
  } | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Жаңа сессия жасап, cookie орнатады */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Ағымдағы сессияны жойып, cookie өшіреді */
export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

/** Cookie бойынша ағымдағы қолданушыны қайтарады (немесе null) */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { school: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.deleteMany({ where: { token } });
    return null;
  }

  const u = session.user;
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    position: u.position,
    schoolId: u.schoolId,
    school: u.school
      ? {
          id: u.school.id,
          name: u.school.name,
          sheetUrl: u.school.sheetUrl,
          sheetRange: u.school.sheetRange,
          sheetYearStart: u.school.sheetYearStart,
        }
      : null,
  };
}
