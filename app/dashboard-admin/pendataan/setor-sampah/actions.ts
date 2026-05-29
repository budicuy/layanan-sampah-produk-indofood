"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import {
  ekpedisi,
  hargaSampah,
  type JenisSampah,
  mutasiSaldo,
  nasabah,
  setorEkspedisi,
  setorLangsung,
} from "@/lib/db/schema";

const REVALIDATE = "/dashboard-admin/pendataan/setor-sampah";

async function getAdminSession() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");
  return session;
}

function adminLabel(
  session: Awaited<ReturnType<typeof getAdminSession>>,
  isAiValid: boolean,
  isAutoFill?: boolean,
) {
  const name = session.user.name || session.user.username || "Admin";
  if (isAiValid) return "Sistem (AI)";
  if (isAutoFill) return `Otomatis oleh ${name}`;
  return `Manual oleh ${name}`;
}

// ═══════════════════════════════════════════════════════════════════
// SETOR LANGSUNG
// ═══════════════════════════════════════════════════════════════════

/** Verifikasi & kreditkan poin untuk Setor Langsung (satu langkah) */
export async function verifikasiSetorLangsung(
  id: string,
  beratAktual: number,
  ratePerKg: number,
  catatan?: string,
  isAutoFill?: boolean,
) {
  const session = await getAdminSession();

  const setor = await db.query.setorLangsung.findFirst({
    where: (setorLangsung, { eq }) => eq(setorLangsung.id, id),
    with: { nasabah: { with: { user: true } } },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "MENUNGGU_VERIFIKASI")
    throw new Error("Status harus MENUNGGU_VERIFIKASI");

  const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
  const totalValue = Math.round(beratAktual * ratePerKg);
  const now = new Date();
  const verifiedByLabel = adminLabel(
    session,
    setor.statusValidasi === "VALID",
    isAutoFill,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(setorLangsung)
      .set({
        status: "SELESAI",
        beratAktual,
        catatanAdmin: catatan ?? null,
        verifiedBy: verifiedByLabel,
        verifikasiAt: now,
        selesaiAt: now,
        hargaPerKg: isBankSampah ? ratePerKg : null,
        totalHarga: isBankSampah ? totalValue : null,
        poinPerKg: isBankSampah ? null : ratePerKg,
        totalPoin: isBankSampah ? null : totalValue,
        updatedAt: now,
      })
      .where(eq(setorLangsung.id, id));

    const nasabahUpdate = {
      updatedAt: now,
      ...(isBankSampah
        ? { saldo: sql`saldo + ${totalValue}` }
        : { poin: sql`poin + ${totalValue}` }),
    };

    await tx
      .update(nasabah)
      .set(nasabahUpdate)
      .where(eq(nasabah.id, setor.nasabahId));

    await tx.insert(mutasiSaldo).values({
      id: crypto.randomUUID(),
      nasabahId: setor.nasabahId,
      jumlah: totalValue,
      keterangan: isBankSampah
        ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg`
        : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg`,
      referensiId: id,
      jenisReferensi: "LANGSUNG",
    });
  });

  revalidatePath(REVALIDATE);
}

/** Tolak Setor Langsung */
export async function tolakSetorLangsung(id: string, catatan: string) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  await db
    .update(setorLangsung)
    .set({
      status: "DITOLAK",
      catatanAdmin: catatan,
      verifiedBy: `Manual oleh ${name}`,
      verifikasiAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(setorLangsung.id, id));
  revalidatePath(REVALIDATE);
}

/** Batch verifikasi Setor Langsung — proses sekaligus semua yang di-checklist */
export async function batchVerifikasiSetorLangsung(ids: string[]) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  const now = new Date();

  const [setoranList, allPrices] = await Promise.all([
    db.query.setorLangsung.findMany({
      where: (setorLangsung, { and, inArray, eq }) =>
        and(
          inArray(setorLangsung.id, ids),
          eq(setorLangsung.status, "MENUNGGU_VERIFIKASI"),
        ),
      with: { nasabah: { with: { user: true } } },
    }),
    db.select().from(hargaSampah).orderBy(desc(hargaSampah.bulan)),
  ]);

  // Bangun map harga terbaru per jenis sampah (in-memory, 1 query)
  const latestPrices: Record<string, (typeof allPrices)[0]> = {};
  for (const price of allPrices) {
    if (!latestPrices[price.jenisSampah]) {
      latestPrices[price.jenisSampah] = price;
    }
  }

  // ── Hitung semua nilai di luar transaksi ───────────────────────────────────
  type ItemPayload = {
    setor: (typeof setoranList)[0];
    isBankSampah: boolean;
    ratePerKg: number;
    beratAktual: number;
    totalValue: number;
    verifiedByLabel: string;
  };

  const payloads: ItemPayload[] = setoranList.map((setor) => {
    const hargaDB = latestPrices[setor.jenisSampah];
    const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
    const ratePerKg = hargaDB
      ? isBankSampah
        ? hargaDB.harga
        : hargaDB.point
      : 0;
    const beratAktual = setor.beratTerbaca ?? setor.beratEstimasi;
    const totalValue = Math.round(beratAktual * ratePerKg);
    const verifiedByLabel =
      setor.statusValidasi === "VALID"
        ? "Sistem (AI)"
        : `Otomatis oleh ${name}`;
    return {
      setor,
      isBankSampah,
      ratePerKg,
      beratAktual,
      totalValue,
      verifiedByLabel,
    };
  });

  if (payloads.length === 0) return;

  // ── Agregasi poin/saldo per nasabah (hindari N update ke nasabah yang sama) ─
  // Pisahkan antara nasabah biasa (poin) dan bank sampah (saldo)
  const poinAggr: Record<string, number> = {}; // nasabahId → total poin
  const saldoAggr: Record<string, number> = {}; // nasabahId → total saldo
  for (const { setor, isBankSampah, totalValue } of payloads) {
    if (isBankSampah) {
      saldoAggr[setor.nasabahId] =
        (saldoAggr[setor.nasabahId] ?? 0) + totalValue;
    } else {
      poinAggr[setor.nasabahId] = (poinAggr[setor.nasabahId] ?? 0) + totalValue;
    }
  }

  // ── 1. Bulk UPDATE setor_langsung via raw SQL (1 query untuk semua item) ───
  const valueRows = payloads.map(
    ({
      setor,
      isBankSampah,
      ratePerKg,
      beratAktual,
      totalValue,
      verifiedByLabel,
    }) =>
      sql`(
        ${setor.id}::text,
        ${beratAktual}::float8,
        ${verifiedByLabel}::text,
        ${isBankSampah ? ratePerKg : null}::int,
        ${isBankSampah ? totalValue : null}::int,
        ${isBankSampah ? null : ratePerKg}::int,
        ${isBankSampah ? null : totalValue}::int
      )`,
  );

  await db.execute(sql`
    UPDATE "setor_langsung" AS s
    SET
      "status"       = 'SELESAI'::"StatusSetorLangsung",
      "beratAktual"  = v.berat_aktual,
      "catatanAdmin" = NULL,
      "verifiedBy"   = v.verified_by,
      "verifikasiAt" = ${now},
      "selesaiAt"    = ${now},
      "hargaPerKg"   = v.harga_per_kg,
      "totalHarga"   = v.total_harga,
      "poinPerKg"    = v.poin_per_kg,
      "totalPoin"    = v.total_poin,
      "updatedAt"    = ${now}
    FROM (VALUES ${sql.join(valueRows, sql`, `)})
      AS v(id, berat_aktual, verified_by, harga_per_kg, total_harga, poin_per_kg, total_poin)
    WHERE s.id = v.id
  `);

  // ── 2. Update poin/saldo nasabah (sudah teragregasi, hanya N nasabah unik) ─
  await db.transaction(async (tx) => {
    for (const [nasabahId, totalPoin] of Object.entries(poinAggr)) {
      await tx
        .update(nasabah)
        .set({ poin: sql`poin + ${totalPoin}`, updatedAt: now })
        .where(eq(nasabah.id, nasabahId));
    }
    for (const [nasabahId, totalSaldo] of Object.entries(saldoAggr)) {
      await tx
        .update(nasabah)
        .set({ saldo: sql`saldo + ${totalSaldo}`, updatedAt: now })
        .where(eq(nasabah.id, nasabahId));
    }
  });

  // ── 3. Bulk INSERT mutasi_saldo via values (1 query untuk semua mutasi) ─
  await db.insert(mutasiSaldo).values(
    payloads.map(({ setor, isBankSampah, beratAktual, totalValue }) => ({
      id: crypto.randomUUID(),
      nasabahId: setor.nasabahId,
      jumlah: totalValue,
      keterangan: isBankSampah
        ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg (Batch)`
        : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg (Batch)`,
      referensiId: setor.id,
      jenisReferensi: "LANGSUNG",
    })),
  );

  revalidatePath(REVALIDATE);
}

// ═══════════════════════════════════════════════════════════════════
// SETOR EKSPEDISI
// ═══════════════════════════════════════════════════════════════════

/** Verifikasi awal Setor Ekspedisi (approve/tolak) */
export async function verifikasiSetorEkspedisi(
  id: string,
  approve: boolean,
  catatan?: string,
) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  await db
    .update(setorEkspedisi)
    .set({
      status: approve ? "TERVERIFIKASI" : "DITOLAK",
      catatanAdmin: catatan ?? null,
      verifiedBy: `Manual oleh ${name}`,
      verifikasiAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(setorEkspedisi.id, id));
  revalidatePath(REVALIDATE);
}

/** Tugaskan kurir ekspedisi */
export async function tugaskanEkpedisi(id: string, ekpedisiId: string) {
  await getAdminSession();
  const setor = await db.query.setorEkspedisi.findFirst({
    where: (setorEkspedisi, { eq }) => eq(setorEkspedisi.id, id),
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "TERVERIFIKASI")
    throw new Error("Status harus TERVERIFIKASI");
  await db
    .update(setorEkspedisi)
    .set({
      ekpedisiId,
      status: "DALAM_PENJEMPUTAN",
      penjemputanAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(setorEkspedisi.id, id));
  revalidatePath(REVALIDATE);
}

/** Admin konfirmasi sampah sudah diterima di pusat */
export async function konfirmasiSampahDiterima(id: string) {
  await getAdminSession();
  const setor = await db.query.setorEkspedisi.findFirst({
    where: (setorEkspedisi, { eq }) => eq(setorEkspedisi.id, id),
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SUDAH_DISERAHKAN")
    throw new Error("Konsumen belum konfirmasi serah terima");
  await db
    .update(setorEkspedisi)
    .set({
      status: "SAMPAH_DITERIMA",
      sampahDiterimaAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(setorEkspedisi.id, id));
  revalidatePath(REVALIDATE);
}

/** Verifikasi akhir Setor Ekspedisi & kredit poin */
export async function verifikasiAkhirSetorEkspedisi(
  id: string,
  beratAktual: number,
  ratePerKg: number,
  catatan?: string,
  isAutoFill?: boolean,
) {
  const session = await getAdminSession();
  const setor = await db.query.setorEkspedisi.findFirst({
    where: (setorEkspedisi, { eq }) => eq(setorEkspedisi.id, id),
    with: { nasabah: { with: { user: true } } },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SAMPAH_DITERIMA")
    throw new Error("Sampah belum dikonfirmasi diterima");

  const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
  const totalValue = Math.round(beratAktual * ratePerKg);
  const verifiedByLabel = adminLabel(
    session,
    setor.statusValidasi === "VALID",
    isAutoFill,
  );
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(setorEkspedisi)
      .set({
        status: "SELESAI",
        beratAktual,
        catatanAdmin: catatan ?? null,
        verifiedBy: verifiedByLabel,
        selesaiAt: now,
        hargaPerKg: isBankSampah ? ratePerKg : null,
        totalHarga: isBankSampah ? totalValue : null,
        poinPerKg: isBankSampah ? null : ratePerKg,
        totalPoin: isBankSampah ? null : totalValue,
        updatedAt: now,
      })
      .where(eq(setorEkspedisi.id, id));

    const nasabahUpdate = {
      updatedAt: now,
      ...(isBankSampah
        ? { saldo: sql`saldo + ${totalValue}` }
        : { poin: sql`poin + ${totalValue}` }),
    };

    await tx
      .update(nasabah)
      .set(nasabahUpdate)
      .where(eq(nasabah.id, setor.nasabahId));

    await tx.insert(mutasiSaldo).values({
      id: crypto.randomUUID(),
      nasabahId: setor.nasabahId,
      jumlah: totalValue,
      keterangan: isBankSampah
        ? `Setor ekspedisi (Cash) ${setor.jenisSampah} ${beratAktual} kg`
        : `Setor ekspedisi ${setor.jenisSampah} ${beratAktual} kg`,
      referensiId: id,
      jenisReferensi: "EKSPEDISI",
    });
  });

  revalidatePath(REVALIDATE);
}

/** Batch verifikasi awal Setor Ekspedisi */
export async function batchVerifikasiSetorEkspedisi(ids: string[]) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  const now = new Date();

  const setoranList = await db.query.setorEkspedisi.findMany({
    where: (setorEkspedisi, { and, inArray, eq }) =>
      and(
        inArray(setorEkspedisi.id, ids),
        eq(setorEkspedisi.status, "MENUNGGU_VERIFIKASI"),
      ),
  });

  await db.transaction(async (tx) => {
    for (const setor of setoranList) {
      const isAiValid = setor.statusValidasi === "VALID";
      await tx
        .update(setorEkspedisi)
        .set({
          status: "TERVERIFIKASI",
          catatanAdmin: null,
          verifiedBy: isAiValid ? "Sistem (AI)" : `Otomatis oleh ${name}`,
          verifikasiAt: now,
          updatedAt: now,
        })
        .where(eq(setorEkspedisi.id, setor.id));
    }
  });

  revalidatePath(REVALIDATE);
}

// ═══════════════════════════════════════════════════════════════════
// DATA FETCHERS
// ═══════════════════════════════════════════════════════════════════

export async function getSetorLangsungData() {
  await getAdminSession();
  return db.query.setorLangsung.findMany({
    orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
    with: {
      nasabah: {
        columns: {
          id: true,
          noTelp: true,
          alamat: true,
          nik: true,
        },
        with: {
          user: {
            columns: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

export async function getSetorEkspedisiData() {
  await getAdminSession();
  return db.query.setorEkspedisi.findMany({
    orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.createdAt)],
    with: {
      nasabah: {
        columns: {
          id: true,
          noTelp: true,
          alamat: true,
          nik: true,
        },
        with: {
          user: {
            columns: {
              name: true,
              role: true,
            },
          },
        },
      },
      ekpedisi: {
        columns: {
          id: true,
          nama: true,
          noTelp: true,
          alamat: true,
        },
      },
    },
  });
}

export async function getEkpedisiList() {
  await getAdminSession();
  return db
    .select({
      id: ekpedisi.id,
      nama: ekpedisi.nama,
      noTelp: ekpedisi.noTelp,
      alamat: ekpedisi.alamat,
    })
    .from(ekpedisi)
    .orderBy(desc(ekpedisi.createdAt));
}

export async function getHargaTerbaru(jenisSampah: string) {
  await getAdminSession();
  const hargaList = await db
    .select({
      harga: hargaSampah.harga,
      point: hargaSampah.point,
      bulan: hargaSampah.bulan,
    })
    .from(hargaSampah)
    .where(eq(hargaSampah.jenisSampah, jenisSampah as JenisSampah))
    .orderBy(desc(hargaSampah.bulan))
    .limit(1);
  return hargaList[0] || null;
}

/**
 * Mengambil semua harga terbaru per jenis sampah sekaligus (1 query).
 * Menghindari masalah N+1 ketika digunakan di halaman yang menampilkan banyak item.
 * Mengembalikan Record<jenisSampah, { harga, point, bulan }>.
 */
export async function getAllHargaTerbaru() {
  await getAdminSession();
  const allPrices = await db
    .select({
      jenisSampah: hargaSampah.jenisSampah,
      harga: hargaSampah.harga,
      point: hargaSampah.point,
      bulan: hargaSampah.bulan,
    })
    .from(hargaSampah)
    .orderBy(desc(hargaSampah.bulan));
  // Ambil hanya entry pertama (terbaru) per jenisSampah
  const map: Record<string, { harga: number; point: number; bulan: Date }> = {};
  for (const price of allPrices) {
    const key = price.jenisSampah as string;
    if (!map[key]) {
      map[key] = { harga: price.harga, point: price.point, bulan: price.bulan };
    }
  }
  return map;
}
