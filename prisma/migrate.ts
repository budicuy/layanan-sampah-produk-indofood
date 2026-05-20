import "dotenv/config";

async function main() {
  const { prisma } = await import("../lib/prisma");

  console.log("🚀 Starting database migration via neon serverless adapter...");

  // 1. Alter Nasabah table: Rename saldo to poin
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "nasabah" RENAME COLUMN "saldo" TO "poin"',
    );
    console.log("✅ Column 'saldo' renamed to 'poin' in 'nasabah' table.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping nasabah.saldo rename:", msg);
  }

  // 2. Alter HargaSampah table: Add point column
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "harga_sampah" ADD COLUMN "point" integer NOT NULL DEFAULT 0',
    );
    console.log("✅ Column 'point' added to 'harga_sampah' table.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping harga_sampah.point addition:", msg);
  }

  // 3. Alter SetorSampah table: Rename hargaPerKg to poinPerKg
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "setor_sampah" RENAME COLUMN "hargaPerKg" TO "poinPerKg"',
    );
    console.log(
      "✅ Column 'hargaPerKg' renamed to 'poinPerKg' in 'setor_sampah' table.",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping setor_sampah.hargaPerKg rename:", msg);
  }

  // 4. Alter SetorSampah table: Rename totalSaldo to totalPoin
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "setor_sampah" RENAME COLUMN "totalSaldo" TO "totalPoin"',
    );
    console.log(
      "✅ Column 'totalSaldo' renamed to 'totalPoin' in 'setor_sampah' table.",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping setor_sampah.totalSaldo rename:", msg);
  }

  // 5. Alter Role enum: Add BANK_SAMPAH value
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TYPE \"Role\" ADD VALUE IF NOT EXISTS 'BANK_SAMPAH'",
    );
    console.log("✅ Value 'BANK_SAMPAH' added to 'Role' enum.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping Role.BANK_SAMPAH addition:", msg);
  }

  // 6. Alter Nasabah table: Add saldo column
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "nasabah" ADD COLUMN "saldo" integer NOT NULL DEFAULT 0',
    );
    console.log("✅ Column 'saldo' added to 'nasabah' table.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping nasabah.saldo addition:", msg);
  }

  // 7. Alter SetorSampah table: Add hargaPerKg column
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "setor_sampah" ADD COLUMN "hargaPerKg" integer',
    );
    console.log("✅ Column 'hargaPerKg' added to 'setor_sampah' table.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping setor_sampah.hargaPerKg addition:", msg);
  }

  // 8. Alter SetorSampah table: Add totalHarga column
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "setor_sampah" ADD COLUMN "totalHarga" integer',
    );
    console.log("✅ Column 'totalHarga' added to 'setor_sampah' table.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping setor_sampah.totalHarga addition:", msg);
  }

  // 9. Alter database: Create KuponStatus enum and kupon table
  try {
    await prisma.$executeRawUnsafe(
      "CREATE TYPE \"KuponStatus\" AS ENUM ('AKTIF', 'DIGUNAKAN', 'EXPIRED')",
    );
    console.log("✅ Enum 'KuponStatus' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping KuponStatus enum creation:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "kupon" (
        "id" TEXT NOT NULL,
        "kode" TEXT NOT NULL,
        "nama" TEXT NOT NULL,
        "deskripsi" TEXT,
        "poinCost" INTEGER NOT NULL,
        "status" "KuponStatus" NOT NULL DEFAULT 'AKTIF',
        "nasabahId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "digunakanAt" TIMESTAMP(3),
        CONSTRAINT "kupon_pkey" PRIMARY KEY ("id")
      )`,
    );
    console.log("✅ Table 'kupon' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping kupon table creation:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX "kupon_kode_key" ON "kupon"("kode")',
    );
    console.log("✅ Unique index 'kupon_kode_key' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping unique index creation:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      'CREATE INDEX "kupon_nasabahId_idx" ON "kupon"("nasabahId")',
    );
    console.log("✅ Index 'kupon_nasabahId_idx' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping index creation:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "kupon" ADD CONSTRAINT "kupon_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
    console.log("✅ Foreign key constraint 'kupon_nasabahId_fkey' added.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping foreign key addition:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "tier_kupon" (
        "id" TEXT NOT NULL,
        "tier" TEXT NOT NULL,
        "poinMin" INTEGER NOT NULL,
        "nama" TEXT NOT NULL,
        "deskripsi" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "tier_kupon_pkey" PRIMARY KEY ("id")
      )`,
    );
    console.log("✅ Table 'tier_kupon' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping tier_kupon table creation:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX "tier_kupon_tier_key" ON "tier_kupon"("tier")',
    );
    console.log("✅ Unique index 'tier_kupon_tier_key' created.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping unique index 'tier_kupon_tier_key' creation:", msg);
  }

  try {
    const countResult = await prisma.$queryRawUnsafe<Record<string, number>[]>(
      'SELECT COUNT(*)::integer as count FROM "tier_kupon"',
    );
    const count = countResult[0]?.count ?? 0;
    if (count === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "tier_kupon" ("id", "tier", "poinMin", "nama", "deskripsi", "createdAt", "updatedAt") VALUES
          ('t1', 'DIAMOND', 1000, 'Diamond', 'Kupon Tier Diamond bernilai tinggi. Bisa ditukarkan dengan barang premium seperti Rice Cooker, Blender, Setrika, atau Kipas Angin Turbo.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('t2', 'GOLD', 500, 'Gold', 'Kupon Tier Gold. Bisa ditukarkan dengan barang bernilai sedang seperti Wajan Anti Lengket, Termos Stainless 1L, Wadah Makanan Set, atau Payung Premium.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('t3', 'PLATINUM', 250, 'Platinum', 'Kupon Tier Platinum. Bisa ditukarkan dengan barang kebutuhan harian seperti Paket Sembako lengkap (Minyak Goreng 2L & Gula 1kg), atau Voucher Belanja Rp 50.000.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      );
      console.log("✅ Default tiers seeded into 'tier_kupon'.");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ℹ️ Skipping default tiers seeding:", msg);
  }

  console.log("🎉 Migration script finished successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
