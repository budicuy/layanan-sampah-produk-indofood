CREATE TYPE "public"."JenisSampah" AS ENUM('PLASTIK', 'KARTON', 'PAPER_CUP');--> statement-breakpoint
CREATE TYPE "public"."KategoriNasabah" AS ENUM('BANK_SAMPAH', 'WARMIENDO', 'PERORANGAN');--> statement-breakpoint
CREATE TYPE "public"."KuponStatus" AS ENUM('AKTIF', 'DIGUNAKAN', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('KONSUMEN', 'ADMIN', 'HRD', 'BANK_SAMPAH');--> statement-breakpoint
CREATE TYPE "public"."StatusNasabah" AS ENUM('AKTIF', 'NONAKTIF');--> statement-breakpoint
CREATE TYPE "public"."StatusPencairan" AS ENUM('DIAJUKAN', 'DIVERIFIKASI', 'DICAIRKAN', 'DITOLAK');--> statement-breakpoint
CREATE TYPE "public"."StatusSetorEkspedisi" AS ENUM('MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK', 'DALAM_PENJEMPUTAN', 'SUDAH_DISERAHKAN', 'SAMPAH_DITERIMA', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."StatusSetorLangsung" AS ENUM('MENUNGGU_VERIFIKASI', 'DITOLAK', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."StatusUser" AS ENUM('AKTIF', 'NONAKTIF');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ekpedisi" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"noTelp" text NOT NULL,
	"alamat" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harga_sampah" (
	"id" text PRIMARY KEY NOT NULL,
	"harga" integer NOT NULL,
	"point" integer DEFAULT 0 NOT NULL,
	"bulan" timestamp (3) NOT NULL,
	"jenisSampah" "JenisSampah" NOT NULL,
	"berat" double precision NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kupon" (
	"id" text PRIMARY KEY NOT NULL,
	"kode" text NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text,
	"poinCost" integer NOT NULL,
	"status" "KuponStatus" DEFAULT 'AKTIF' NOT NULL,
	"nasabahId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"digunakanAt" timestamp (3),
	CONSTRAINT "kupon_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE "mutasi_saldo" (
	"id" text PRIMARY KEY NOT NULL,
	"nasabahId" text NOT NULL,
	"jumlah" integer NOT NULL,
	"keterangan" text NOT NULL,
	"referensiId" text,
	"jenisReferensi" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nasabah" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"alamat" text NOT NULL,
	"noTelp" text NOT NULL,
	"kategori" "KategoriNasabah" NOT NULL,
	"nik" text NOT NULL,
	"noRek" text NOT NULL,
	"jenisBank" text NOT NULL,
	"titikLokasi" text,
	"status" "StatusNasabah" DEFAULT 'AKTIF' NOT NULL,
	"poin" integer DEFAULT 0 NOT NULL,
	"saldo" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "nasabah_userId_unique" UNIQUE("userId"),
	CONSTRAINT "nasabah_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "pencairan" (
	"id" text PRIMARY KEY NOT NULL,
	"nasabahId" text NOT NULL,
	"jumlah" integer NOT NULL,
	"status" "StatusPencairan" DEFAULT 'DIAJUKAN' NOT NULL,
	"catatan" text,
	"catatanAdmin" text,
	"buktiFoto" text,
	"diajukanAt" timestamp (3) DEFAULT now() NOT NULL,
	"diverifikasi" timestamp (3),
	"dicairkan" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_material" (
	"id" text PRIMARY KEY NOT NULL,
	"periode" timestamp (3) NOT NULL,
	"kategori" text NOT NULL,
	"klasifikasi" text NOT NULL,
	"beratGr" double precision NOT NULL,
	"beratKg" double precision NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "raw_material_periode_kategori_klasifikasi_key" UNIQUE("periode","kategori","klasifikasi")
);
--> statement-breakpoint
CREATE TABLE "setor_ekspedisi" (
	"id" text PRIMARY KEY NOT NULL,
	"nasabahId" text NOT NULL,
	"jenisSampah" "JenisSampah" NOT NULL,
	"beratEstimasi" double precision NOT NULL,
	"beratAktual" double precision,
	"keterangan" text,
	"alamatPenjemputan" text DEFAULT '' NOT NULL,
	"status" "StatusSetorEkspedisi" DEFAULT 'MENUNGGU_VERIFIKASI' NOT NULL,
	"catatanAdmin" text,
	"verifiedBy" text,
	"verifikasiAt" timestamp (3),
	"ekpedisiId" text,
	"penjemputanAt" timestamp (3),
	"diserahkanAt" timestamp (3),
	"sampahDiterimaAt" timestamp (3),
	"selesaiAt" timestamp (3),
	"poinPerKg" integer,
	"totalPoin" integer,
	"hargaPerKg" integer,
	"totalHarga" integer,
	"gambarTimbangan" text,
	"gambarBukti" text[] DEFAULT '{}'::text[] NOT NULL,
	"statusValidasi" text,
	"beratTerbaca" double precision,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setor_langsung" (
	"id" text PRIMARY KEY NOT NULL,
	"nasabahId" text NOT NULL,
	"jenisSampah" "JenisSampah" NOT NULL,
	"beratEstimasi" double precision NOT NULL,
	"beratAktual" double precision,
	"keterangan" text,
	"status" "StatusSetorLangsung" DEFAULT 'MENUNGGU_VERIFIKASI' NOT NULL,
	"catatanAdmin" text,
	"verifiedBy" text,
	"verifikasiAt" timestamp (3),
	"selesaiAt" timestamp (3),
	"poinPerKg" integer,
	"totalPoin" integer,
	"hargaPerKg" integer,
	"totalHarga" integer,
	"gambarTimbangan" text,
	"gambarBukti" text[] DEFAULT '{}'::text[] NOT NULL,
	"statusValidasi" text,
	"beratTerbaca" double precision,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier_kupon" (
	"id" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"poinMin" integer NOT NULL,
	"nama" text NOT NULL,
	"deskripsi" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "tier_kupon_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"role" "Role" DEFAULT 'KONSUMEN' NOT NULL,
	"status" "StatusUser" DEFAULT 'AKTIF' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kupon" ADD CONSTRAINT "kupon_nasabahId_nasabah_id_fk" FOREIGN KEY ("nasabahId") REFERENCES "public"."nasabah"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_saldo" ADD CONSTRAINT "mutasi_saldo_nasabahId_nasabah_id_fk" FOREIGN KEY ("nasabahId") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pencairan" ADD CONSTRAINT "pencairan_nasabahId_nasabah_id_fk" FOREIGN KEY ("nasabahId") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setor_ekspedisi" ADD CONSTRAINT "setor_ekspedisi_nasabahId_nasabah_id_fk" FOREIGN KEY ("nasabahId") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setor_ekspedisi" ADD CONSTRAINT "setor_ekspedisi_ekpedisiId_ekpedisi_id_fk" FOREIGN KEY ("ekpedisiId") REFERENCES "public"."ekpedisi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setor_langsung" ADD CONSTRAINT "setor_langsung_nasabahId_nasabah_id_fk" FOREIGN KEY ("nasabahId") REFERENCES "public"."nasabah"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "kupon_nasabahId_idx" ON "kupon" USING btree ("nasabahId");--> statement-breakpoint
CREATE INDEX "mutasi_saldo_nasabahId_idx" ON "mutasi_saldo" USING btree ("nasabahId");--> statement-breakpoint
CREATE INDEX "pencairan_nasabahId_status_idx" ON "pencairan" USING btree ("nasabahId","status");--> statement-breakpoint
CREATE INDEX "pencairan_status_idx" ON "pencairan" USING btree ("status");--> statement-breakpoint
CREATE INDEX "setor_ekspedisi_nasabahId_status_idx" ON "setor_ekspedisi" USING btree ("nasabahId","status");--> statement-breakpoint
CREATE INDEX "setor_ekspedisi_status_idx" ON "setor_ekspedisi" USING btree ("status");--> statement-breakpoint
CREATE INDEX "setor_ekspedisi_selesaiAt_idx" ON "setor_ekspedisi" USING btree ("selesaiAt");--> statement-breakpoint
CREATE INDEX "setor_langsung_nasabahId_status_idx" ON "setor_langsung" USING btree ("nasabahId","status");--> statement-breakpoint
CREATE INDEX "setor_langsung_status_idx" ON "setor_langsung" USING btree ("status");--> statement-breakpoint
CREATE INDEX "setor_langsung_selesaiAt_idx" ON "setor_langsung" USING btree ("selesaiAt");