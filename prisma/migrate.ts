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
