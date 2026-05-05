/*
  Optimizations:
  - Drop unused column `fotoLokasi` on `nasabah`
  - Make `userId` on `nasabah` required (NOT NULL)
  - Merge `JenisProduk` into `JenisSampah` for `produk.jenis`
  - Replace single-column index on setor_sampah(nasabahId) with composite (nasabahId, status)
  - Change nasabah FK to CASCADE on delete
*/

-- DropForeignKey
ALTER TABLE "nasabah" DROP CONSTRAINT "nasabah_userId_fkey";

-- DropIndex (will be replaced by composite)
DROP INDEX "setor_sampah_nasabahId_idx";

-- AlterTable nasabah: drop fotoLokasi, make userId NOT NULL
ALTER TABLE "nasabah" DROP COLUMN "fotoLokasi",
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable produk: convert JenisProduk → JenisSampah safely via text cast
ALTER TABLE "produk"
  ALTER COLUMN "jenis" TYPE "JenisSampah" USING ("jenis"::text::"JenisSampah");

-- DropEnum (now safe since no column references it)
DROP TYPE "JenisProduk";

-- CreateIndex: composite for common query pattern
CREATE INDEX "setor_sampah_nasabahId_status_idx" ON "setor_sampah"("nasabahId", "status");

-- AddForeignKey: cascade delete
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
