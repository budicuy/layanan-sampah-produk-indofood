-- CreateEnum
CREATE TYPE "Role" AS ENUM ('KONSUMEN', 'ADMIN', 'HRD');

-- CreateEnum
CREATE TYPE "KategoriNasabah" AS ENUM ('BANK_SAMPAH', 'WARMIENDO', 'PERORANGAN');

-- CreateEnum
CREATE TYPE "StatusNasabah" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "JenisProduk" AS ENUM ('PLASTIK', 'KARTON');

-- CreateEnum
CREATE TYPE "StatusUser" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "StatusEkpedisi" AS ENUM ('BELUM_DI_PROSES', 'PROSES', 'DONE');

-- CreateEnum
CREATE TYPE "JenisSampah" AS ENUM ('PLASTIK', 'KARTON');

-- CreateEnum
CREATE TYPE "StatusSetorSampah" AS ENUM ('MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK', 'DALAM_PENJEMPUTAN', 'SUDAH_DISERAHKAN', 'SAMPAH_DITERIMA', 'SELESAI');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KONSUMEN',
    "status" "StatusUser" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "kategori" "KategoriNasabah" NOT NULL,
    "nik" TEXT NOT NULL,
    "noRek" TEXT NOT NULL,
    "jenisBank" TEXT NOT NULL,
    "fotoLokasi" TEXT,
    "titikLokasi" TEXT,
    "status" "StatusNasabah" NOT NULL DEFAULT 'AKTIF',
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" "JenisProduk" NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "brand" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "isi" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ekpedisi" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "noTelp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "titikLokasi" TEXT,
    "status" "StatusEkpedisi" NOT NULL DEFAULT 'BELUM_DI_PROSES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ekpedisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_sampah" (
    "id" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "bulan" TIMESTAMP(3) NOT NULL,
    "jenisSampah" "JenisSampah" NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harga_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_pendataan" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "jenisSampah" "JenisSampah" NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "produkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_pendataan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setor_sampah" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "jenisSampah" "JenisSampah" NOT NULL,
    "beratEstimasi" DOUBLE PRECISION NOT NULL,
    "beratAktual" DOUBLE PRECISION,
    "keterangan" TEXT,
    "alamatPenjemputan" TEXT NOT NULL,
    "status" "StatusSetorSampah" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "catatanAdmin" TEXT,
    "verifikasiAt" TIMESTAMP(3),
    "ekpedisiId" TEXT,
    "penjemputanAt" TIMESTAMP(3),
    "diserahkanAt" TIMESTAMP(3),
    "hargaPerKg" INTEGER,
    "totalSaldo" INTEGER,
    "selesaiAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setor_sampah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_saldo" (
    "id" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "referensiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutasi_saldo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_userId_key" ON "nasabah"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_nik_key" ON "nasabah"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "produk_kode_key" ON "produk"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "ekpedisi_userId_key" ON "ekpedisi"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ekpedisi" ADD CONSTRAINT "ekpedisi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_pendataan" ADD CONSTRAINT "laporan_pendataan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_pendataan" ADD CONSTRAINT "laporan_pendataan_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "produk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor_sampah" ADD CONSTRAINT "setor_sampah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor_sampah" ADD CONSTRAINT "setor_sampah_ekpedisiId_fkey" FOREIGN KEY ("ekpedisiId") REFERENCES "ekpedisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_saldo" ADD CONSTRAINT "mutasi_saldo_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
