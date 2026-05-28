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
import { SetorEkspedisiSeed } from "./seeder/seed_setor_ekspedisi";
import { SetorLangsungSeed } from "./seeder/seed_setor_langsung";

async function main() {
  const { prisma } = await import("../lib/prisma");

  console.log("🧹 Cleaning up database...");
  await prisma.mutasiSaldo.deleteMany();
  await prisma.setorLangsung.deleteMany();
  await prisma.setorEkspedisi.deleteMany();
  await prisma.nasabah.deleteMany();
  await prisma.ekpedisi.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hargaSampah.deleteMany();

  console.log("👥 Preparing seed data...");
  const adminUserId = randomUUID();
  const adminPassword = await hash(AdminSeed.passwordPlain, 12);
  const defaultPassword = await hash("123456", 12);

  const nasabahUsers = NasabahsSeed.map((n) => ({
    ...n,
    userId: randomUUID(),
    nasabahId: randomUUID(),
  }));

  // Precompute poin & saldo balances from completed setoran
  const poinSumMap = new Map<string, number>();
  const saldoSumMap = new Map<string, number>();

  for (const s of SetorLangsungSeed) {
    if (s.status === "SELESAI" && s.totalPoin) {
      const isBS = s.username === "banksampah";
      const map = isBS ? saldoSumMap : poinSumMap;
      map.set(s.username, (map.get(s.username) || 0) + s.totalPoin);
    }
  }
  for (const s of SetorEkspedisiSeed) {
    if (s.status === "SELESAI" && s.totalPoin) {
      const isBS = s.username === "banksampah";
      const map = isBS ? saldoSumMap : poinSumMap;
      map.set(s.username, (map.get(s.username) || 0) + s.totalPoin);
    }
  }

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

  const ekpedisiList = await Promise.all(
    EkpedisiSeed.map((e) =>
      prisma.ekpedisi.create({
        data: { nama: e.nama, noTelp: e.noTelp, alamat: e.alamat },
      }),
    ),
  );

  await prisma.hargaSampah.createMany({
    data: HargaSampahSeed.map((h) => ({
      harga: h.harga,
      point: h.point,
      bulan: new Date(h.bulan),
      jenisSampah: h.jenisSampah as JenisSampah,
      berat: h.berat,
    })),
  });

  const nasabahMap = new Map(nasabahUsers.map((n) => [n.username, n]));

  // ─── Seed SetorLangsung ───────────────────────────────────────────────
  const langsungData = SetorLangsungSeed.map((item) => {
    const nasabah = nasabahMap.get(item.username) || nasabahUsers[0];
    const isBS = nasabah.kategori === "BANK_SAMPAH";
    const id = randomUUID();
    return {
      id,
      nasabahId: nasabah.nasabahId,
      jenisSampah: item.jenisSampah as JenisSampah,
      beratEstimasi: item.beratEstimasi,
      beratAktual: item.beratAktual ?? null,
      status: item.status,
      poinPerKg: isBS ? null : (item.poinPerKg ?? null),
      totalPoin: isBS ? null : (item.totalPoin ?? null),
      hargaPerKg: isBS ? (item.poinPerKg ?? 0) * 1000 : null,
      totalHarga: isBS ? (item.totalPoin ?? 0) * 1000 : null,
      selesaiAt: item.selesaiAt ? new Date(item.selesaiAt) : null,
      verifikasiAt: item.verifikasiAt ? new Date(item.verifikasiAt) : null,
      verifiedBy: item.verifiedBy ?? null,
    };
  });

  await prisma.setorLangsung.createMany({ data: langsungData as never });

  // ─── Seed SetorEkspedisi ──────────────────────────────────────────────
  const ekspedisiData = SetorEkspedisiSeed.map((item, idx) => {
    const nasabah = nasabahMap.get(item.username) || nasabahUsers[0];
    const isBS = nasabah.kategori === "BANK_SAMPAH";
    const id = randomUUID();
    // Assign a kurir to completed ones (round-robin)
    const ekpedisiId =
      item.status === "SELESAI" && ekpedisiList.length > 0
        ? ekpedisiList[idx % ekpedisiList.length].id
        : null;
    return {
      id,
      nasabahId: nasabah.nasabahId,
      jenisSampah: item.jenisSampah as JenisSampah,
      beratEstimasi: item.beratEstimasi,
      beratAktual: item.beratAktual ?? null,
      alamatPenjemputan: nasabah.alamat,
      status: item.status,
      poinPerKg: isBS ? null : (item.poinPerKg ?? null),
      totalPoin: isBS ? null : (item.totalPoin ?? null),
      hargaPerKg: isBS ? (item.poinPerKg ?? 0) * 1000 : null,
      totalHarga: isBS ? (item.totalPoin ?? 0) * 1000 : null,
      ekpedisiId,
      selesaiAt: item.selesaiAt ? new Date(item.selesaiAt) : null,
      verifikasiAt: item.verifikasiAt ? new Date(item.verifikasiAt) : null,
      penjemputanAt: item.penjemputanAt ? new Date(item.penjemputanAt) : null,
      diserahkanAt: item.diserahkanAt ? new Date(item.diserahkanAt) : null,
      sampahDiterimaAt: item.sampahDiterimaAt
        ? new Date(item.sampahDiterimaAt)
        : null,
      verifiedBy: item.verifiedBy ?? null,
    };
  });

  await prisma.setorEkspedisi.createMany({ data: ekspedisiData as never });

  // ─── MutasiSaldo ─────────────────────────────────────────────────────
  const mutasiLangsung = langsungData
    .filter((s) => s.status === "SELESAI")
    .map((s) => {
      const isBS = s.hargaPerKg !== null;
      const jumlah = isBS ? (s.totalHarga ?? 0) : (s.totalPoin ?? 0);
      return {
        nasabahId: s.nasabahId,
        jumlah,
        keterangan: `Setor langsung ${s.jenisSampah} ${s.beratAktual} kg`,
        referensiId: s.id,
        jenisReferensi: "LANGSUNG",
      };
    });

  const mutasiEkspedisi = ekspedisiData
    .filter((s) => s.status === "SELESAI")
    .map((s) => {
      const isBS = s.hargaPerKg !== null;
      const jumlah = isBS ? (s.totalHarga ?? 0) : (s.totalPoin ?? 0);
      return {
        nasabahId: s.nasabahId,
        jumlah,
        keterangan: `Setor ekspedisi ${s.jenisSampah} ${s.beratAktual} kg`,
        referensiId: s.id,
        jenisReferensi: "EKSPEDISI",
      };
    });

  const allMutasi = [...mutasiLangsung, ...mutasiEkspedisi];
  if (allMutasi.length > 0) {
    await prisma.mutasiSaldo.createMany({ data: allMutasi });
  }

  console.log(`✨ Seeding completed!`);
  console.log(
    `   - ${langsungData.length} SetorLangsung (${langsungData.filter((s) => s.status === "SELESAI").length} selesai)`,
  );
  console.log(
    `   - ${ekspedisiData.length} SetorEkspedisi (${ekspedisiData.filter((s) => s.status === "SELESAI").length} selesai)`,
  );
  console.log(`   - ${allMutasi.length} MutasiSaldo`);
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
