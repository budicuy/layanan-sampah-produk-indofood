import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import type { KategoriNasabah, StatusNasabah } from "./generated/prisma/enums";
import { NasabahsSeed } from "./seed_nasabah";

async function main() {
  console.log("🌱 Seeding user admin...");

  const { prisma } = await import("../lib/prisma");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@gmail.com",
      username: "admin",
      emailVerified: true,
      role: "ADMIN",
      accounts: {
        create: {
          id: "admin-account-id", // ID unik untuk account
          accountId: "admin", // biasanya sama dengan userId atau username
          providerId: "credential", // Better Auth pakai "credential" untuk email/password
          password: await hashPassword("password"),
        },
      },
    },
  });

  console.log("Seeding dummy Nasabah data...");

  for (const n of NasabahsSeed) {
    await prisma.nasabah.upsert({
      where: { nik: n.nik },
      update: {},
      create: {
        nama: n.nama,
        alamat: n.alamat,
        noTelp: n.noTelp,
        kategori: n.kategori as KategoriNasabah,
        nik: n.nik,
        noRek: n.noRek,
        jenisBank: n.jenisBank,
        fotoLokasi: n.fotoLokasi,
        titikLokasi: n.titikLokasi,
        status: n.status as StatusNasabah,
      },
    });
  }

  console.log("Seeding complete!");

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
