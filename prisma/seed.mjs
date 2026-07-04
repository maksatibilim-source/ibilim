// ============================================================================
//  Дерекқорды бастапқы деректермен толтыру (seed) — таза Node ESM (tsx керек емес)
//  Тек бір admin аккаунт жасайды. Идемпотентті: admin бар болса — өткізеді.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Жүйе әкімшісі";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin "${username}" бұрыннан бар — өткізілді.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role: "admin",
      position: "Жүйе әкімшісі",
    },
  });

  console.log(`Admin аккаунт жасалды: "${username}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
