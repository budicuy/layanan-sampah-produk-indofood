import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import type {
  JenisProduk,
  KategoriNasabah,
  StatusNasabah,
  Role,
  StatusUser,
  StatusEkpedisi,
  JenisSampah,
} from "./generated/prisma/enums";
import { NasabahsSeed } from "./seed_nasabah";
import { ProdukSeed } from "./seed_produk";
import { UsersSeed } from "./seed_user";
import { EkpedisiSeed } from "./seed_ekspedisi";
import { HargaSampahSeed } from "./seed_harga_sampah";
import { LaporanSeed } from "./seed_laporan";

async function main() {
  const { prisma } = await import("../lib/prisma");

  console.log("🌱 Seeding user admin...");
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
          id: "admin-account-id",
          accountId: "admin",
          providerId: "credential",
          password: await hashPassword("password"),
        },
      },
    },
  });

  console.log("Seeding dummy Users...");
  for (const u of UsersSeed) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        username: u.username,
        emailVerified: true,
        role: u.role as Role,
        status: u.status as StatusUser,
        accounts: {
          create: {
            id: `acc-${u.username}`,
            accountId: u.username,
            providerId: "credential",
            password: await hashPassword("password"),
          },
        },
      },
    });
  }

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

  console.log("Seeding dummy Produk data...");
  for (const p of ProdukSeed) {
    await prisma.produk.upsert({
      where: { kode: p.kode },
      update: {},
      create: {
        kode: p.kode,
        nama: p.nama,
        jenis: p.jenis as JenisProduk,
        berat: p.berat,
        brand: p.brand,
        harga: p.harga,
        isi: p.isi,
      },
    });
  }

  console.log("Seeding dummy Ekpedisi data...");
  for (const e of EkpedisiSeed) {
    const existing = await prisma.ekpedisi.findFirst({ where: { noTelp: e.noTelp } });
    if (!existing) {
      await prisma.ekpedisi.create({
        data: {
          noTelp: e.noTelp,
          alamat: e.alamat,
          titikLokasi: e.titikLokasi,
          status: e.status as StatusEkpedisi,
        },
      });
    }
  }

  console.log("Seeding dummy Harga Sampah data...");
  for (const h of HargaSampahSeed) {
    const existing = await prisma.hargaSampah.findFirst({
      where: {
        bulan: h.bulan,
        jenisSampah: h.jenisSampah as JenisSampah,
      },
    });
    if (!existing) {
      await prisma.hargaSampah.create({
        data: {
          harga: h.harga,
          bulan: h.bulan,
          jenisSampah: h.jenisSampah as JenisSampah,
          berat: h.berat,
        },
      });
    }
  }

  console.log("Seeding dummy Laporan data...");
  for (const l of LaporanSeed) {
    const nasabah = await prisma.nasabah.findUnique({ where: { nik: l.nasabahNik } });
    const produk = await prisma.produk.findUnique({ where: { kode: l.produkKode } });

    if (nasabah && produk) {
      await prisma.laporanPendataan.create({
        data: {
          nasabahId: nasabah.id,
          jenisSampah: l.jenisSampah as JenisSampah,
          berat: l.berat,
          produkId: produk.id,
        },
      });
    }
  }

  console.log("✅ Seeding complete!");
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
