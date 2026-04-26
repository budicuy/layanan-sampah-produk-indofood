import "dotenv/config";
import { auth } from "../lib/auth";

async function main() {
  console.log("🌱 Seeding user admin...");

  // Better Auth mengelola hash password & account secara otomatis
  await auth.api.signUpEmail({
    body: {
      name: "Admin",
      email: "admin@banksampah.id",
      password: "password",
      username: "admin",
    },
  });

  // Update role ke ADMIN via Prisma (Better Auth tidak expose ini langsung)
  const { prisma } = await import("../lib/prisma");
  await prisma.user.update({
    where: { username: "admin" },
    data: { role: "ADMIN" },
  });

  console.log("✅ Admin berhasil dibuat: username=admin, password=password");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
