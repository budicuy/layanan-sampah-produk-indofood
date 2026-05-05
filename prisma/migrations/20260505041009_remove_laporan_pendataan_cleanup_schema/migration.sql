/*
  Warnings:

  - You are about to drop the `laporan_pendataan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "laporan_pendataan" DROP CONSTRAINT "laporan_pendataan_nasabahId_fkey";

-- DropForeignKey
ALTER TABLE "laporan_pendataan" DROP CONSTRAINT "laporan_pendataan_produkId_fkey";

-- DropTable
DROP TABLE "laporan_pendataan";

-- CreateIndex
CREATE INDEX "mutasi_saldo_nasabahId_idx" ON "mutasi_saldo"("nasabahId");

-- CreateIndex
CREATE INDEX "setor_sampah_nasabahId_idx" ON "setor_sampah"("nasabahId");

-- CreateIndex
CREATE INDEX "setor_sampah_status_idx" ON "setor_sampah"("status");

-- CreateIndex
CREATE INDEX "setor_sampah_selesaiAt_idx" ON "setor_sampah"("selesaiAt");
