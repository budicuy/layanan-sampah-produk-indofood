import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "../db";
import {
  account,
  ekpedisi,
  hargaSampah,
  type JenisSampah,
  type KategoriNasabah,
  kupon,
  mutasiSaldo,
  nasabah,
  pencairan,
  type Role,
  rawMaterial,
  type StatusNasabah,
  type StatusSetorEkspedisi,
  type StatusSetorLangsung,
  setorEkspedisi,
  setorLangsung,
  user,
} from "./schema";

import { AdminSeed } from "./seeder/seed_admin";
import { EkpedisiSeed } from "./seeder/seed_ekspedisi";
import { HargaSampahSeed } from "./seeder/seed_harga_sampah";
import { NasabahsSeed } from "./seeder/seed_nasabah";
import { SetorEkspedisiSeed } from "./seeder/seed_setor_ekspedisi";
import { SetorLangsungSeed } from "./seeder/seed_setor_langsung";

async function main() {
  console.log("🧹 Cleaning up database...");
  await db.delete(mutasiSaldo);
  await db.delete(setorLangsung);
  await db.delete(setorEkspedisi);
  await db.delete(nasabah);
  await db.delete(ekpedisi);
  await db.delete(account);
  await db.delete(user);
  await db.delete(hargaSampah);
  await db.delete(pencairan);
  await db.delete(kupon);
  await db.delete(rawMaterial);

  console.log("👥 Preparing seed data...");
  const adminUserId = randomUUID();
  const adminPassword = await hash(AdminSeed.passwordPlain, 12);
  const defaultPassword = await hash("123456", 12);

  const nasabahUsers = NasabahsSeed.map((n) => ({
    ...n,
    userId: randomUUID(),
    nasabahId: randomUUID(),
  }));

  const extraSystemUsers = [
    {
      id: randomUUID(),
      name: "HRD Staff 1",
      email: "hrd1@gmail.com",
      username: "hrd1",
      role: "HRD" as Role,
    },
    {
      id: randomUUID(),
      name: "HRD Manager",
      email: "hrd2@gmail.com",
      username: "hrd2",
      role: "HRD" as Role,
    },
    {
      id: randomUUID(),
      name: "Co-Admin",
      email: "admin2@gmail.com",
      username: "admin2",
      role: "ADMIN" as Role,
    },
  ];

  const firstNames = [
    "Andi",
    "Budi",
    "Cici",
    "Dedi",
    "Evi",
    "Feri",
    "Gita",
    "Hadi",
    "Indah",
    "Joko",
    "Kartika",
    "Lutfi",
    "Mega",
    "Novi",
    "Oki",
    "Putra",
    "Rini",
    "Soni",
    "Tari",
    "Udin",
  ];
  const lastNames = [
    "Saputra",
    "Wibowo",
    "Lestari",
    "Kusuma",
    "Pratama",
    "Hidayat",
    "Sari",
    "Purnomo",
    "Setiawan",
    "Utami",
    "Wijaya",
    "Siregar",
    "Nasution",
    "Ginting",
    "Sitompul",
  ];

  for (let i = nasabahUsers.length; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const name = `${firstName} ${lastName} ${i}`;
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
    const email = `${username}@gmail.com`;

    let kategori = "PERORANGAN";
    if (i % 5 === 0) {
      kategori = "WARMIENDO";
    } else if (i % 10 === 0) {
      kategori = "BANK_SAMPAH";
    }

    nasabahUsers.push({
      email,
      username,
      nama: name,
      alamat: `Jl. Melati No. ${i + 1}, Kota Banjarmasin`,
      noTelp: `0812${String(10000000 + i)}`,
      kategori,
      nik: `63710123456${String(10000 + i)}`,
      noRek: `9876${String(100000 + i)}`,
      jenisBank: i % 3 === 0 ? "BCA" : i % 3 === 1 ? "Mandiri" : "BRI",
      titikLokasi: `-3.31${i}, 114.59${i}`,
      status: i % 15 === 0 ? "NONAKTIF" : "AKTIF",
      userId: randomUUID(),
      nasabahId: randomUUID(),
    });
  }

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
    ...extraSystemUsers,
    ...nasabahUsers.map((n) => ({
      id: n.userId,
      name: n.nama,
      email: n.email,
      username: n.username,
      role: (n.kategori === "BANK_SAMPAH" ? "BANK_SAMPAH" : "KONSUMEN") as Role,
    })),
  ];

  const accountsData = [
    { id: randomUUID(), userId: adminUserId, password: adminPassword },
    ...extraSystemUsers.map((u) => ({
      id: randomUUID(),
      userId: u.id,
      password: defaultPassword,
    })),
    ...nasabahUsers.map((n) => ({
      id: randomUUID(),
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
    titikLokasi: n.titikLokasi || null,
    status: n.status as StatusNasabah,
    poin: poinSumMap.get(n.username) || 0,
    saldo: saldoSumMap.get(n.username) || 0,
  }));

  // Insert master data
  for (const u of usersData) {
    await db.insert(user).values(u);
  }
  for (const a of accountsData) {
    await db.insert(account).values(a);
  }
  for (const n of nasabahsData) {
    await db.insert(nasabah).values(n);
  }

  const ekpedisiDataToInsert = [...EkpedisiSeed];
  const companyPrefixes = [
    "Jaya",
    "Sentosa",
    "Bintang",
    "Trans",
    "Cepat",
    "Express",
    "Logistic",
    "Cargo",
    "Lintas",
    "Abadi",
  ];
  const companySuffixes = [
    "Kargo",
    "Logistik",
    "Kurir",
    "Ekspres",
    "Transporter",
    "Antaran",
  ];

  for (let i = ekpedisiDataToInsert.length; i < 50; i++) {
    const prefix = companyPrefixes[i % companyPrefixes.length];
    const suffix = companySuffixes[(i * 2) % companySuffixes.length];
    ekpedisiDataToInsert.push({
      nama: `${prefix} ${suffix} ${i}`,
      noTelp: `0813${String(20000000 + i)}`,
      alamat: `Kawasan Pergudangan Blok ${String.fromCharCode(65 + (i % 6))}-${i + 1}, Banjarmasin`,
    });
  }

  const ekpedisiList: (typeof ekpedisi.$inferSelect)[] = [];
  for (const e of ekpedisiDataToInsert) {
    const [res] = await db
      .insert(ekpedisi)
      .values({
        id: randomUUID(),
        nama: e.nama,
        noTelp: e.noTelp,
        alamat: e.alamat,
      })
      .returning();
    ekpedisiList.push(res);
  }

  const hargaSampahToInsert = [...HargaSampahSeed];
  const kinds: JenisSampah[] = ["PLASTIK", "KARTON", "PAPER_CUP"];
  const startDate = new Date("2024-06-01");

  for (let i = 0; i < 39; i++) {
    const monthOffset = Math.floor(i / 3);
    const kind = kinds[i % 3];
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + monthOffset,
      1,
    );

    let basePrice = 3000;
    let basePoints = 30;
    if (kind === "PLASTIK") {
      basePrice = 4000 + (monthOffset % 5) * 100;
      basePoints = 40 + (monthOffset % 5) * 1;
    } else if (kind === "KARTON") {
      basePrice = 2200 + (monthOffset % 4) * 80;
      basePoints = 22 + (monthOffset % 4) * 1;
    } else {
      basePrice = 2500 + (monthOffset % 6) * 120;
      basePoints = 25 + (monthOffset % 6) * 1;
    }

    hargaSampahToInsert.push({
      harga: basePrice,
      point: basePoints,
      bulan: date,
      jenisSampah: kind,
      berat: 1.0,
    });
  }

  for (const h of hargaSampahToInsert) {
    await db.insert(hargaSampah).values({
      id: randomUUID(),
      point: h.point,
      harga: h.harga,
      bulan: new Date(h.bulan),
      jenisSampah: h.jenisSampah as JenisSampah,
      berat: h.berat,
    });
  }

  // Seed Raw Material
  const startYear = 2025;
  const startMonth = 9; // October (0-indexed 9)
  const rawMaterialsToInsert = [];

  for (let mOffset = 0; mOffset < 8; mOffset++) {
    const date = new Date(startYear, startMonth + mOffset, 1);

    // Etiket (NN, GN, CN)
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Etiket",
      klasifikasi: "NN",
      beratGr: 8.5 + (mOffset % 3) * 0.1,
      beratKg: (8.5 + (mOffset % 3) * 0.1) / 1000,
    });
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Etiket",
      klasifikasi: "GN",
      beratGr: 7.2 + (mOffset % 3) * 0.1,
      beratKg: (7.2 + (mOffset % 3) * 0.1) / 1000,
    });
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Etiket",
      klasifikasi: "CN",
      beratGr: 6.0 + (mOffset % 3) * 0.1,
      beratKg: (6.0 + (mOffset % 3) * 0.1) / 1000,
    });

    // Karton (NN, GN, CN)
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Karton",
      klasifikasi: "NN",
      beratGr: 320.0 + (mOffset % 5) * 5.0,
      beratKg: (320.0 + (mOffset % 5) * 5.0) / 1000,
    });
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Karton",
      klasifikasi: "GN",
      beratGr: 280.0 + (mOffset % 5) * 5.0,
      beratKg: (280.0 + (mOffset % 5) * 5.0) / 1000,
    });
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Karton",
      klasifikasi: "CN",
      beratGr: 250.0 + (mOffset % 5) * 5.0,
      beratKg: (250.0 + (mOffset % 5) * 5.0) / 1000,
    });

    // Cup (CN)
    rawMaterialsToInsert.push({
      id: randomUUID(),
      periode: date,
      kategori: "Cup",
      klasifikasi: "CN",
      beratGr: 12.0 + (mOffset % 3) * 0.2,
      beratKg: (12.0 + (mOffset % 3) * 0.2) / 1000,
    });
  }

  for (const rm of rawMaterialsToInsert) {
    await db.insert(rawMaterial).values(rm);
  }

  const nasabahMap = new Map(nasabahUsers.map((n) => [n.username, n]));

  // ─── Seed SetorLangsung ───────────────────────────────────────────────
  const langsungData = SetorLangsungSeed.map((item) => {
    const nasabahItem = nasabahMap.get(item.username) || nasabahUsers[0];
    const isBS = nasabahItem.kategori === "BANK_SAMPAH";
    const id = randomUUID();
    return {
      id,
      nasabahId: nasabahItem.nasabahId,
      jenisSampah: item.jenisSampah as JenisSampah,
      beratEstimasi: item.beratEstimasi,
      beratAktual: item.beratAktual ?? null,
      status: item.status as StatusSetorLangsung,
      poinPerKg: isBS ? null : (item.poinPerKg ?? null),
      totalPoin: isBS ? null : (item.totalPoin ?? null),
      hargaPerKg: isBS ? (item.poinPerKg ?? 0) * 1000 : null,
      totalHarga: isBS ? (item.totalPoin ?? 0) * 1000 : null,
      selesaiAt: item.selesaiAt ? new Date(item.selesaiAt) : null,
      verifikasiAt: item.verifikasiAt ? new Date(item.verifikasiAt) : null,
      verifiedBy: item.verifiedBy ?? null,
    };
  });

  for (const l of langsungData) {
    await db.insert(setorLangsung).values(l);
  }

  // ─── Seed SetorEkspedisi ──────────────────────────────────────────────
  const ekspedisiData = SetorEkspedisiSeed.map((item, idx) => {
    const nasabahItem = nasabahMap.get(item.username) || nasabahUsers[0];
    const isBS = nasabahItem.kategori === "BANK_SAMPAH";
    const id = randomUUID();
    const ekpedisiId =
      (item.status === "SELESAI" ||
        item.status === "DALAM_PENJEMPUTAN" ||
        item.status === "SUDAH_DISERAHKAN" ||
        item.status === "SAMPAH_DITERIMA") &&
      ekpedisiList.length > 0
        ? ekpedisiList[idx % ekpedisiList.length].id
        : null;
    return {
      id,
      nasabahId: nasabahItem.nasabahId,
      jenisSampah: item.jenisSampah as JenisSampah,
      beratEstimasi: item.beratEstimasi,
      beratAktual: item.beratAktual ?? null,
      alamatPenjemputan: nasabahItem.alamat,
      status: item.status as StatusSetorEkspedisi,
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

  for (const e of ekspedisiData) {
    await db.insert(setorEkspedisi).values(e);
  }

  // ─── MutasiSaldo ─────────────────────────────────────────────────────
  const mutasiLangsung = langsungData
    .filter((s) => s.status === "SELESAI")
    .map((s) => {
      const isBS = s.hargaPerKg !== null;
      const jumlah = isBS ? (s.totalHarga ?? 0) : (s.totalPoin ?? 0);
      return {
        id: randomUUID(),
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
        id: randomUUID(),
        nasabahId: s.nasabahId,
        jumlah,
        keterangan: `Setor ekspedisi ${s.jenisSampah} ${s.beratAktual} kg`,
        referensiId: s.id,
        jenisReferensi: "EKSPEDISI",
      };
    });

  const allMutasi = [...mutasiLangsung, ...mutasiEkspedisi];
  for (const m of allMutasi) {
    await db.insert(mutasiSaldo).values(m);
  }

  console.log(`✨ Seeding completed!`);
}

main().catch((err) => {
  console.error("❌ Error during seeding:", err);
  process.exit(1);
});
