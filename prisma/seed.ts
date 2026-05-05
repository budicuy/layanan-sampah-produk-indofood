import "dotenv/config";
import { hash } from "bcryptjs";
import type {
  JenisSampah,
  KategoriNasabah,
  StatusEkpedisi,
  StatusNasabah,
} from "./generated/prisma/enums";
import { EkpedisiSeed } from "./seed_ekspedisi";
import { HargaSampahSeed } from "./seed_harga_sampah";
import { NasabahsSeed } from "./seed_nasabah";
import { ProdukSeed } from "./seed_produk";

async function main() {
  const { prisma } = await import("../lib/prisma");

  console.log("🧹 Cleaning up database...");
  // Order matters for deletion due to foreign key constraints
  await prisma.mutasiSaldo.deleteMany();
  await prisma.setorSampah.deleteMany();
  await prisma.nasabah.deleteMany();
  await prisma.ekpedisi.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.produk.deleteMany();
  await prisma.hargaSampah.deleteMany();
  console.log("✅ Cleanup complete.");

  console.log("🌱 Seeding user admin...");
  const adminPassword = await hash("admin", 12);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@gmail.com",
      username: "admin",
      emailVerified: true,
      role: "ADMIN",
      accounts: {
        create: {
          id: "admin-account-id",
          accountId: "admin",
          providerId: "credential",
          password: adminPassword,
        },
      },
    },
  });

  console.log("👥 Seeding Nasabah + User konsumen...");
  const defaultPassword = await hash("123456", 12);
  for (const n of NasabahsSeed) {
    await prisma.nasabah.create({
      data: {
        nama: n.nama,
        alamat: n.alamat,
        noTelp: n.noTelp,
        kategori: n.kategori as KategoriNasabah,
        nik: n.nik,
        noRek: n.noRek,
        jenisBank: n.jenisBank,
        titikLokasi: n.titikLokasi,
        status: n.status as StatusNasabah,
        user: {
          create: {
            name: n.nama,
            email: n.email,
            username: n.username,
            emailVerified: true,
            role: "KONSUMEN",
            accounts: {
              create: {
                id: `acc-${n.username}`,
                accountId: n.username,
                providerId: "credential",
                password: defaultPassword,
              },
            },
          },
        },
      },
    });
  }
  console.log(`✅ ${NasabahsSeed.length} nasabah + user berhasil dibuat.`);

  console.log("📦 Seeding dummy Produk data...");
  await prisma.produk.createMany({
    data: ProdukSeed.map((p) => ({
      kode: p.kode,
      nama: p.nama,
      jenis: p.jenis as JenisSampah,
      berat: p.berat,
      brand: p.brand,
      harga: p.harga,
      isi: p.isi,
    })),
  });

  console.log("🚚 Seeding dummy Ekpedisi data...");
  await prisma.ekpedisi.createMany({
    data: EkpedisiSeed.map((e) => ({
      noTelp: e.noTelp,
      alamat: e.alamat,
      titikLokasi: e.titikLokasi,
      status: e.status as StatusEkpedisi,
    })),
  });

  console.log("💰 Seeding dummy Harga Sampah data...");
  await prisma.hargaSampah.createMany({
    data: HargaSampahSeed.map((h) => ({
      harga: h.harga,
      bulan: new Date(h.bulan),
      jenisSampah: h.jenisSampah as JenisSampah,
      berat: h.berat,
    })),
  });

  // Seed dummy SetorSampah yang sudah SELESAI (untuk laporan)
  console.log("📊 Seeding dummy SetorSampah (SELESAI) data...");
  const nasabahs = await prisma.nasabah.findMany();
  if (nasabahs.length > 0) {
    const demoData: {
      nasabahId: string;
      jenisSampah: JenisSampah;
      beratEstimasi: number;
      beratAktual: number;
      alamatPenjemputan: string;
      status: "SELESAI";
      hargaPerKg: number;
      totalSaldo: number;
      selesaiAt: Date;
      verifikasiAt: Date;
      penjemputanAt: Date;
      diserahkanAt: Date;
    }[] = [
      {
        nasabahId: nasabahs[0].id,
        jenisSampah: "PLASTIK",
        beratEstimasi: 3.0,
        beratAktual: 2.8,
        alamatPenjemputan: nasabahs[0].alamat,
        status: "SELESAI",
        hargaPerKg: 3000,
        totalSaldo: 8400,
        selesaiAt: new Date("2026-04-05"),
        verifikasiAt: new Date("2026-04-03"),
        penjemputanAt: new Date("2026-04-04"),
        diserahkanAt: new Date("2026-04-04"),
      },
      {
        nasabahId: nasabahs[0].id,
        jenisSampah: "KARTON",
        beratEstimasi: 5.0,
        beratAktual: 4.5,
        alamatPenjemputan: nasabahs[0].alamat,
        status: "SELESAI",
        hargaPerKg: 2000,
        totalSaldo: 9000,
        selesaiAt: new Date("2026-04-15"),
        verifikasiAt: new Date("2026-04-13"),
        penjemputanAt: new Date("2026-04-14"),
        diserahkanAt: new Date("2026-04-14"),
      },
      {
        nasabahId: nasabahs[1]?.id ?? nasabahs[0].id,
        jenisSampah: "PLASTIK",
        beratEstimasi: 2.0,
        beratAktual: 1.8,
        alamatPenjemputan: nasabahs[1]?.alamat ?? nasabahs[0].alamat,
        status: "SELESAI",
        hargaPerKg: 3000,
        totalSaldo: 5400,
        selesaiAt: new Date("2026-04-20"),
        verifikasiAt: new Date("2026-04-18"),
        penjemputanAt: new Date("2026-04-19"),
        diserahkanAt: new Date("2026-04-19"),
      },
      {
        nasabahId: nasabahs[0].id,
        jenisSampah: "PLASTIK",
        beratEstimasi: 4.0,
        beratAktual: 3.9,
        alamatPenjemputan: nasabahs[0].alamat,
        status: "SELESAI",
        hargaPerKg: 3000,
        totalSaldo: 11700,
        selesaiAt: new Date("2026-05-02"),
        verifikasiAt: new Date("2026-04-30"),
        penjemputanAt: new Date("2026-05-01"),
        diserahkanAt: new Date("2026-05-01"),
      },
      {
        nasabahId: nasabahs[2]?.id ?? nasabahs[0].id,
        jenisSampah: "KARTON",
        beratEstimasi: 8.0,
        beratAktual: 7.5,
        alamatPenjemputan: nasabahs[2]?.alamat ?? nasabahs[0].alamat,
        status: "SELESAI",
        hargaPerKg: 2000,
        totalSaldo: 15000,
        selesaiAt: new Date("2026-05-03"),
        verifikasiAt: new Date("2026-05-01"),
        penjemputanAt: new Date("2026-05-02"),
        diserahkanAt: new Date("2026-05-02"),
      },
    ];

    await prisma.setorSampah.createMany({ data: demoData });

    // Buat mutasi saldo untuk setiap setoran selesai
    const selesaiList = await prisma.setorSampah.findMany({
      where: { status: "SELESAI" },
    });
    await prisma.mutasiSaldo.createMany({
      data: selesaiList.map((s) => ({
        nasabahId: s.nasabahId,
        jumlah: s.totalSaldo ?? 0,
        keterangan: `Setor sampah ${s.jenisSampah} ${s.beratAktual} kg`,
        referensiId: s.id,
      })),
    });

    // Update saldo nasabah
    for (const s of selesaiList) {
      await prisma.nasabah.update({
        where: { id: s.nasabahId },
        data: { saldo: { increment: s.totalSaldo ?? 0 } },
      });
    }
    console.log("✅ Dummy SetorSampah (SELESAI) berhasil dibuat.");
  }

  console.log("✨ Seeding complete!");
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
