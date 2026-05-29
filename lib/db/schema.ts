import { relations, sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RoleEnum = pgEnum("Role", [
  "KONSUMEN",
  "ADMIN",
  "HRD",
  "BANK_SAMPAH",
]);

export const StatusUserEnum = pgEnum("StatusUser", ["AKTIF", "NONAKTIF"]);

export const KategoriNasabahEnum = pgEnum("KategoriNasabah", [
  "BANK_SAMPAH",
  "WARMIENDO",
  "PERORANGAN",
]);

export const StatusNasabahEnum = pgEnum("StatusNasabah", ["AKTIF", "NONAKTIF"]);

export const JenisSampahEnum = pgEnum("JenisSampah", [
  "PLASTIK",
  "KARTON",
  "PAPER_CUP",
]);

export const StatusSetorLangsungEnum = pgEnum("StatusSetorLangsung", [
  "MENUNGGU_VERIFIKASI",
  "DITOLAK",
  "SELESAI",
]);

export const StatusSetorEkspedisiEnum = pgEnum("StatusSetorEkspedisi", [
  "MENUNGGU_VERIFIKASI",
  "TERVERIFIKASI",
  "DITOLAK",
  "DALAM_PENJEMPUTAN",
  "SUDAH_DISERAHKAN",
  "SAMPAH_DITERIMA",
  "SELESAI",
]);

export const KuponStatusEnum = pgEnum("KuponStatus", [
  "AKTIF",
  "DIGUNAKAN",
  "EXPIRED",
]);

export const StatusPencairanEnum = pgEnum("StatusPencairan", [
  "DIAJUKAN",
  "DIVERIFIKASI",
  "DICAIRKAN",
  "DITOLAK",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  role: RoleEnum("role").default("KONSUMEN").notNull(),
  status: StatusUserEnum("status").default("AKTIF").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    password: text("password").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("account_userId_idx").on(table.userId),
  }),
);

export const nasabah = pgTable("nasabah", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  alamat: text("alamat").notNull(),
  noTelp: text("noTelp").notNull(),
  kategori: KategoriNasabahEnum("kategori").notNull(),
  nik: text("nik").notNull().unique(),
  noRek: text("noRek").notNull(),
  jenisBank: text("jenisBank").notNull(),
  titikLokasi: text("titikLokasi"),
  status: StatusNasabahEnum("status").default("AKTIF").notNull(),
  poin: integer("poin").default(0).notNull(),
  saldo: integer("saldo").default(0).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const ekpedisi = pgTable("ekpedisi", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  noTelp: text("noTelp").notNull(),
  alamat: text("alamat").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const hargaSampah = pgTable("harga_sampah", {
  id: text("id").primaryKey(),
  harga: integer("harga").notNull(),
  point: integer("point").default(0).notNull(),
  bulan: timestamp("bulan", { precision: 3, mode: "date" }).notNull(),
  jenisSampah: JenisSampahEnum("jenisSampah").notNull(),
  berat: doublePrecision("berat").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const setorLangsung = pgTable(
  "setor_langsung",
  {
    id: text("id").primaryKey(),
    nasabahId: text("nasabahId")
      .notNull()
      .references(() => nasabah.id),
    jenisSampah: JenisSampahEnum("jenisSampah").notNull(),
    beratEstimasi: doublePrecision("beratEstimasi").notNull(),
    beratAktual: doublePrecision("beratAktual"),
    keterangan: text("keterangan"),
    status: StatusSetorLangsungEnum("status")
      .default("MENUNGGU_VERIFIKASI")
      .notNull(),
    catatanAdmin: text("catatanAdmin"),
    verifiedBy: text("verifiedBy"),
    verifikasiAt: timestamp("verifikasiAt", { precision: 3, mode: "date" }),
    selesaiAt: timestamp("selesaiAt", { precision: 3, mode: "date" }),
    poinPerKg: integer("poinPerKg"),
    totalPoin: integer("totalPoin"),
    hargaPerKg: integer("hargaPerKg"),
    totalHarga: integer("totalHarga"),
    gambarTimbangan: text("gambarTimbangan"),
    gambarBukti: text("gambarBukti")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    statusValidasi: text("statusValidasi"),
    beratTerbaca: doublePrecision("beratTerbaca"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    nasabahStatusIdx: index("setor_langsung_nasabahId_status_idx").on(
      table.nasabahId,
      table.status,
    ),
    statusIdx: index("setor_langsung_status_idx").on(table.status),
    selesaiAtIdx: index("setor_langsung_selesaiAt_idx").on(table.selesaiAt),
  }),
);

export const setorEkspedisi = pgTable(
  "setor_ekspedisi",
  {
    id: text("id").primaryKey(),
    nasabahId: text("nasabahId")
      .notNull()
      .references(() => nasabah.id),
    jenisSampah: JenisSampahEnum("jenisSampah").notNull(),
    beratEstimasi: doublePrecision("beratEstimasi").notNull(),
    beratAktual: doublePrecision("beratAktual"),
    keterangan: text("keterangan"),
    alamatPenjemputan: text("alamatPenjemputan").default("").notNull(),
    status: StatusSetorEkspedisiEnum("status")
      .default("MENUNGGU_VERIFIKASI")
      .notNull(),
    catatanAdmin: text("catatanAdmin"),
    verifiedBy: text("verifiedBy"),
    verifikasiAt: timestamp("verifikasiAt", { precision: 3, mode: "date" }),
    ekpedisiId: text("ekpedisiId").references(() => ekpedisi.id, {
      onDelete: "set null",
    }),
    penjemputanAt: timestamp("penjemputanAt", { precision: 3, mode: "date" }),
    diserahkanAt: timestamp("diserahkanAt", { precision: 3, mode: "date" }),
    sampahDiterimaAt: timestamp("sampahDiterimaAt", {
      precision: 3,
      mode: "date",
    }),
    selesaiAt: timestamp("selesaiAt", { precision: 3, mode: "date" }),
    poinPerKg: integer("poinPerKg"),
    totalPoin: integer("totalPoin"),
    hargaPerKg: integer("hargaPerKg"),
    totalHarga: integer("totalHarga"),
    gambarTimbangan: text("gambarTimbangan"),
    gambarBukti: text("gambarBukti")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    statusValidasi: text("statusValidasi"),
    beratTerbaca: doublePrecision("beratTerbaca"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    nasabahStatusIdx: index("setor_ekspedisi_nasabahId_status_idx").on(
      table.nasabahId,
      table.status,
    ),
    statusIdx: index("setor_ekspedisi_status_idx").on(table.status),
    selesaiAtIdx: index("setor_ekspedisi_selesaiAt_idx").on(table.selesaiAt),
  }),
);

export const mutasiSaldo = pgTable(
  "mutasi_saldo",
  {
    id: text("id").primaryKey(),
    nasabahId: text("nasabahId")
      .notNull()
      .references(() => nasabah.id),
    jumlah: integer("jumlah").notNull(),
    keterangan: text("keterangan").notNull(),
    referensiId: text("referensiId"),
    jenisReferensi: text("jenisReferensi"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nasabahIdIdx: index("mutasi_saldo_nasabahId_idx").on(table.nasabahId),
  }),
);

export const kupon = pgTable(
  "kupon",
  {
    id: text("id").primaryKey(),
    kode: text("kode").unique().notNull(),
    nama: text("nama").notNull(),
    deskripsi: text("deskripsi"),
    poinCost: integer("poinCost").notNull(),
    status: KuponStatusEnum("status").default("AKTIF").notNull(),
    nasabahId: text("nasabahId")
      .notNull()
      .references(() => nasabah.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
    digunakanAt: timestamp("digunakanAt", { precision: 3, mode: "date" }),
  },
  (table) => ({
    nasabahIdIdx: index("kupon_nasabahId_idx").on(table.nasabahId),
  }),
);

export const tierKupon = pgTable("tier_kupon", {
  id: text("id").primaryKey(),
  tier: text("tier").unique().notNull(),
  poinMin: integer("poinMin").notNull(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const rawMaterial = pgTable(
  "raw_material",
  {
    id: text("id").primaryKey(),
    periode: timestamp("periode", { precision: 3, mode: "date" }).notNull(),
    kategori: text("kategori").notNull(),
    klasifikasi: text("klasifikasi").notNull(),
    beratGr: doublePrecision("beratGr").notNull(),
    beratKg: doublePrecision("beratKg").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    periodeKategoriKlasifikasiKey: unique(
      "raw_material_periode_kategori_klasifikasi_key",
    ).on(table.periode, table.kategori, table.klasifikasi),
  }),
);

export const pencairan = pgTable(
  "pencairan",
  {
    id: text("id").primaryKey(),
    nasabahId: text("nasabahId")
      .notNull()
      .references(() => nasabah.id),
    jumlah: integer("jumlah").notNull(),
    status: StatusPencairanEnum("status").default("DIAJUKAN").notNull(),
    catatan: text("catatan"),
    catatanAdmin: text("catatanAdmin"),
    buktiFoto: text("buktiFoto"),
    diajukanAt: timestamp("diajukanAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    diverifikasi: timestamp("diverifikasi", { precision: 3, mode: "date" }),
    dicairkan: timestamp("dicairkan", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    nasabahIdStatusIdx: index("pencairan_nasabahId_status_idx").on(
      table.nasabahId,
      table.status,
    ),
    statusIdx: index("pencairan_status_idx").on(table.status),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  nasabah: one(nasabah),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const nasabahRelations = relations(nasabah, ({ one, many }) => ({
  user: one(user, {
    fields: [nasabah.userId],
    references: [user.id],
  }),
  setorLangsung: many(setorLangsung),
  setorEkspedisi: many(setorEkspedisi),
  mutasiSaldo: many(mutasiSaldo),
  kupons: many(kupon),
  pencairan: many(pencairan),
}));

export const ekpedisiRelations = relations(ekpedisi, ({ many }) => ({
  setorEkspedisi: many(setorEkspedisi),
}));

export const setorLangsungRelations = relations(setorLangsung, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [setorLangsung.nasabahId],
    references: [nasabah.id],
  }),
}));

export const setorEkspedisiRelations = relations(setorEkspedisi, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [setorEkspedisi.nasabahId],
    references: [nasabah.id],
  }),
  ekpedisi: one(ekpedisi, {
    fields: [setorEkspedisi.ekpedisiId],
    references: [ekpedisi.id],
  }),
}));

export const mutasiSaldoRelations = relations(mutasiSaldo, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [mutasiSaldo.nasabahId],
    references: [nasabah.id],
  }),
}));

export const kuponRelations = relations(kupon, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [kupon.nasabahId],
    references: [nasabah.id],
  }),
}));

export const pencairanRelations = relations(pencairan, ({ one }) => ({
  nasabah: one(nasabah, {
    fields: [pencairan.nasabahId],
    references: [nasabah.id],
  }),
}));

export type Role = (typeof RoleEnum.enumValues)[number];
export type StatusUser = (typeof StatusUserEnum.enumValues)[number];
export type KategoriNasabah = (typeof KategoriNasabahEnum.enumValues)[number];
export type StatusNasabah = (typeof StatusNasabahEnum.enumValues)[number];
export type JenisSampah = (typeof JenisSampahEnum.enumValues)[number];
export type StatusSetorLangsung =
  (typeof StatusSetorLangsungEnum.enumValues)[number];
export type StatusSetorEkspedisi =
  (typeof StatusSetorEkspedisiEnum.enumValues)[number];
export type KuponStatus = (typeof KuponStatusEnum.enumValues)[number];
export type StatusPencairan = (typeof StatusPencairanEnum.enumValues)[number];
