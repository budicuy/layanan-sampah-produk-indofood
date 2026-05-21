import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import type {
  JenisSampah,
  KategoriNasabah,
  Role,
  StatusNasabah,
} from "./generated/prisma/enums";

import { AdminSeed } from "./seeder/seed_admin";
import { EkpedisiSeed } from "./seeder/seed_ekspedisi";
import { HargaSampahSeed } from "./seeder/seed_harga_sampah";
import { NasabahsSeed } from "./seeder/seed_nasabah";
import { SetorSampahSeed } from "./seeder/seed_setor_sampah";

async function main() {
  const { prisma } = await import("../lib/prisma");

  console.log("🧹 Cleaning up database...");
  await prisma.mutasiSaldo.deleteMany();
  await prisma.setorSampah.deleteMany();
  await prisma.nasabah.deleteMany();
  await prisma.ekpedisi.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hargaSampah.deleteMany();

  console.log("👥 Preparing seed data...");
  const adminUserId = randomUUID();
  const adminPassword = await hash(AdminSeed.passwordPlain, 12);
  const defaultPassword = await hash("123456", 12);

  // Precompute points & balances
  const poinSumMap = new Map<string, number>();
  const saldoSumMap = new Map<string, number>();
  for (const s of SetorSampahSeed) {
    if (s.status === "SELESAI") {
      const isBS = s.username === "banksampah";
      const map = isBS ? saldoSumMap : poinSumMap;
      map.set(
        s.username,
        (map.get(s.username) || 0) + s.totalPoin * (isBS ? 1000 : 1),
      );
    }
  }

  const nasabahUsers = NasabahsSeed.map((n) => ({
    ...n,
    userId: randomUUID(),
    nasabahId: randomUUID(),
  }));

  const usersData = [
    {
      id: adminUserId,
      name: AdminSeed.name,
      email: AdminSeed.email,
      username: AdminSeed.username,
      role: AdminSeed.role as Role,
    },
    ...nasabahUsers.map((n) => ({
      id: n.userId,
      name: n.nama,
      email: n.email,
      username: n.username,
      role: (n.kategori === "BANK_SAMPAH" ? "BANK_SAMPAH" : "KONSUMEN") as Role,
    })),
  ];

  const accountsData = [
    { userId: adminUserId, password: adminPassword },
    ...nasabahUsers.map((n) => ({
      userId: n.userId,
      password: defaultPassword,
    })),
  ];

  const nasabahsData = nasabahUsers.map((n) => ({
    id: n.nasabahId,
    userId: n.userId,
    alamat: n.alamat,
    noTelp: n.noTelp,
    kategori: n.kategori as KategoriNasabah,
    nik: n.nik,
    noRek: n.noRek,
    jenisBank: n.jenisBank,
    titikLokasi: n.titikLokasi,
    status: n.status as StatusNasabah,
    poin: poinSumMap.get(n.username) || 0,
    saldo: saldoSumMap.get(n.username) || 0,
  }));

  await prisma.user.createMany({ data: usersData });
  await prisma.account.createMany({ data: accountsData });
  await prisma.nasabah.createMany({ data: nasabahsData });

  await prisma.ekpedisi.createMany({
    data: EkpedisiSeed.map((e) => ({
      nama: e.nama,
      noTelp: e.noTelp,
      alamat: e.alamat,
    })),
  });

  await prisma.hargaSampah.createMany({
    data: HargaSampahSeed.map((h) => ({
      harga: h.harga,
      point: h.point,
      bulan: new Date(h.bulan),
      jenisSampah: h.jenisSampah as JenisSampah,
      berat: h.berat,
    })),
  });

  // Seed dummy SetorSampah (SELESAI) & MutasiSaldo
  const nasabahMap = new Map(nasabahUsers.map((n) => [n.username, n]));
  const setoranData = SetorSampahSeed.map((item) => {
    const nasabah = nasabahMap.get(item.username) || nasabahUsers[0];
    const isBS = nasabah.kategori === "BANK_SAMPAH";
    return {
      id: randomUUID(),
      nasabahId: nasabah.nasabahId,
      jenisSampah: item.jenisSampah as JenisSampah,
      beratEstimasi: item.beratEstimasi,
      beratAktual: item.beratAktual,
      alamatPenjemputan: nasabah.alamat,
      status: item.status,
      poinPerKg: isBS ? null : item.poinPerKg,
      totalPoin: isBS ? null : item.totalPoin,
      hargaPerKg: isBS ? item.poinPerKg * 1000 : null,
      totalHarga: isBS ? item.totalPoin * 1000 : null,
      selesaiAt: new Date(item.selesaiAt),
      verifikasiAt: new Date(item.verifikasiAt),
      penjemputanAt: new Date(item.penjemputanAt),
      diserahkanAt: new Date(item.diserahkanAt),
    };
  });

  await prisma.setorSampah.createMany({ data: setoranData });

  const mutasiData = setoranData.map((s) => {
    const isBS = s.hargaPerKg !== null;
    const jumlah = isBS ? (s.totalHarga ?? 0) : (s.totalPoin ?? 0);
    return {
      nasabahId: s.nasabahId,
      jumlah,
      keterangan: `Setor sampah ${s.jenisSampah} ${s.beratAktual} kg (${
        isBS ? `Rp ${jumlah.toLocaleString("id-ID")}` : `${jumlah} poin`
      })`,
      referensiId: s.id,
    };
  });

  await prisma.mutasiSaldo.createMany({ data: mutasiData });
  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
