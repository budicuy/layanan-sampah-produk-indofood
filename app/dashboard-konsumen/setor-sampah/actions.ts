"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import {
  type JenisSampah,
  mutasiSaldo,
  nasabah,
  setorEkspedisi,
  setorLangsung,
} from "@/lib/db/schema";
import { analyzeScaleImage } from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";

const REVALIDATE_PATHS = [
  "/dashboard-konsumen/setor-sampah",
  "/dashboard-konsumen",
];

interface SubmitBaseData {
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  keterangan?: string;
  gambarTimbanganBase64: string;
  gambarTimbanganMime: string;
  gambarBuktiBase64List: string[];
  gambarBuktiMimeList: string[];
}

/**
 * Prepare submission: AI validation → Upload on success only
 * Flow:
 * 1. AI Validation FIRST (gatekeeper - jika gagal, throw error langsung)
 * 2. Jika VALID, PARALEL:
 *    - Compress proof images
 *    - Upload scale image ke R2
 *    - Query hargaSampah
 * 3. Upload proof images ke R2 (PARALEL)
 */
async function prepareSubmission(data: SubmitBaseData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
  });
  if (!nasabahData)
    throw new Error("Profil nasabah belum terdaftar. Hubungi admin.");

  // ═══════════════════════════════════════════════════════════════════
  // GATEKEEPER: AI VALIDATION PERTAMA (hanya foto timbangan)
  // ═══════════════════════════════════════════════════════════════════
  const scaleBuffer = Buffer.from(data.gambarTimbanganBase64, "base64");
  let beratTerbacaKg: number | null = null;

  const analysis = await analyzeScaleImage(
    scaleBuffer,
    data.gambarTimbanganMime,
  );

  // ❌ JIKA TIDAK TERBACA: Stop & throw error (jangan upload apapun)
  if (!analysis.terbaca) {
    throw new Error(
      `Gambar timbangan tidak terdeteksi: ${analysis.alasan_gagal || "Ambil gambar yang lebih jelas."}`,
    );
  }

  // Convert berat AI ke KG
  const rawWeight = analysis.berat_terbaca ?? 0;
  const unit = (analysis.satuan || "").toLowerCase();
  beratTerbacaKg =
    unit === "gram" || unit === "g" || unit === "gr" || unit === "grams"
      ? rawWeight / 1000
      : rawWeight;

  // ❌ JIKA SELISIH > 100g: Stop & throw error (jangan upload apapun)
  if (Math.abs(beratTerbacaKg - data.beratEstimasi) > 0.1) {
    throw new Error(
      `Gambar timbangan tidak sesuai: input ${data.beratEstimasi} kg, AI terdeteksi ${beratTerbacaKg.toFixed(2)} kg. Selisih maks 100 gram.`,
    );
  }

  // ✅ AI VALID! Sekarang proses upload PARALEL:
  // 1. Upload scale image ke R2
  // 2. Compress proof images
  // 3. Query hargaSampah
  const [scaleUrl, proofBuffersWithMime, hargaDB] = await Promise.all([
    // Upload scale image
    uploadToR2(scaleBuffer, data.gambarTimbanganMime, "setor-sampah"),

    // Prepare proof image buffers (convert base64 → Buffer)
    Promise.all(
      data.gambarBuktiBase64List.map((base64, idx) => ({
        buffer: Buffer.from(base64, "base64"),
        mimeType: data.gambarBuktiMimeList[idx] || "image/jpeg",
      })),
    ),

    // Query harga sampah
    db.query.hargaSampah.findFirst({
      where: (hargaSampah, { eq }) =>
        eq(hargaSampah.jenisSampah, data.jenisSampah),
      orderBy: (hargaSampah, { desc }) => [desc(hargaSampah.bulan)],
    }),
  ]);

  // Upload proof images ke R2 PARALEL (bukan sequential)
  const proofUrls = await Promise.all(
    proofBuffersWithMime.map(({ buffer, mimeType }) =>
      uploadToR2(buffer, mimeType, "setor-sampah"),
    ),
  );

  return {
    nasabah: nasabahData,
    scaleUrl,
    proofUrls,
    hargaDB,
    beratTerbacaKg,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SETOR LANGSUNG
// ═══════════════════════════════════════════════════════════════════

export async function submitSetorLangsung(data: SubmitBaseData) {
  try {
    // prepareSubmission akan throw error jika AI validation gagal
    const {
      nasabah: nsb,
      scaleUrl,
      proofUrls,
      hargaDB,
      beratTerbacaKg,
    } = await prepareSubmission(data);

    // ✅ AI VALID! Hitung poin dan insert ke DB
    const poinPerKg = hargaDB?.point ?? 0;
    const beratFinal = beratTerbacaKg ?? data.beratEstimasi;
    const totalPoin = Math.round(beratFinal * poinPerKg);

    await db.transaction(async (tx) => {
      const newId = crypto.randomUUID();
      await tx.insert(setorLangsung).values({
        id: newId,
        nasabahId: nsb.id,
        jenisSampah: data.jenisSampah,
        beratEstimasi: data.beratEstimasi,
        beratAktual: beratFinal,
        keterangan: data.keterangan || null,
        gambarTimbangan: scaleUrl,
        gambarBukti: proofUrls,
        statusValidasi: "VALID",
        beratTerbaca: beratTerbacaKg,
        status: "SELESAI",
        poinPerKg,
        totalPoin,
        verifiedBy: "Sistem (AI)",
        verifikasiAt: new Date(),
        selesaiAt: new Date(),
      });
      await tx
        .update(nasabah)
        .set({ poin: sql`poin + ${totalPoin}`, updatedAt: new Date() })
        .where(eq(nasabah.id, nsb.id));
      await tx.insert(mutasiSaldo).values({
        id: crypto.randomUUID(),
        nasabahId: nsb.id,
        jumlah: totalPoin,
        keterangan: `Setor langsung (AI) ${data.jenisSampah} ${beratFinal.toFixed(2)} kg`,
        referensiId: newId,
        jenisReferensi: "LANGSUNG",
      });
    });

    for (const p of REVALIDATE_PATHS) revalidatePath(p);
    return { success: true };
  } catch (error) {
    console.error("submitSetorLangsung error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengirim setor langsung",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SETOR EKSPEDISI
// ═══════════════════════════════════════════════════════════════════

export async function submitSetorSampah(
  data: SubmitBaseData & { alamatPenjemputan: string },
) {
  try {
    // prepareSubmission akan throw error jika AI validation gagal
    const {
      nasabah: nsb,
      scaleUrl,
      proofUrls,
      beratTerbacaKg,
    } = await prepareSubmission(data);

    // ✅ AI VALID! Insert data ekspedisi (status MENUNGGU_VERIFIKASI untuk flow ekspedisi)
    await db.insert(setorEkspedisi).values({
      id: crypto.randomUUID(),
      nasabahId: nsb.id,
      jenisSampah: data.jenisSampah,
      beratEstimasi: data.beratEstimasi,
      keterangan: data.keterangan || null,
      alamatPenjemputan: data.alamatPenjemputan,
      gambarTimbangan: scaleUrl,
      gambarBukti: proofUrls,
      statusValidasi: "VALID",
      beratTerbaca: beratTerbacaKg,
      status: "MENUNGGU_VERIFIKASI",
    });

    for (const p of REVALIDATE_PATHS) revalidatePath(p);
    return { success: true };
  } catch (error) {
    console.error("submitSetorSampah error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengirim penjemputan",
    };
  }
}

/** Konsumen konfirmasi sudah menyerahkan sampah ke kurir */
export async function konfirmasiSerahTerima(setorEkspedisiId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const nasabahData = await db.query.nasabah.findFirst({
      where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    });
    if (!nasabahData) throw new Error("Nasabah tidak ditemukan");

    const setor = await db.query.setorEkspedisi.findFirst({
      where: (setorEkspedisi, { and, eq }) =>
        and(
          eq(setorEkspedisi.id, setorEkspedisiId),
          eq(setorEkspedisi.nasabahId, nasabahData.id),
        ),
    });
    if (!setor) throw new Error("Data setor tidak ditemukan");
    if (setor.status !== "DALAM_PENJEMPUTAN")
      throw new Error("Status tidak valid untuk aksi ini");

    await db
      .update(setorEkspedisi)
      .set({
        status: "SUDAH_DISERAHKAN",
        diserahkanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(setorEkspedisi.id, setorEkspedisiId));

    for (const p of REVALIDATE_PATHS) revalidatePath(p);
    return { success: true };
  } catch (error) {
    console.error("konfirmasiSerahTerima error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal konfirmasi serah terima",
    };
  }
}

/** Fetch data nasabah + kedua jenis setoran (gabung untuk halaman setor-sampah konsumen) */
export async function getSetorSampahKonsumenData() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true, alamat: true, poin: true, saldo: true },
  });
  if (!nasabahData) return { nasabah: null };

  const [setorLangsungList, setorEkspedisiList] = await Promise.all([
    db.query.setorLangsung.findMany({
      where: (setorLangsung, { eq }) =>
        eq(setorLangsung.nasabahId, nasabahData.id),
      orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
      limit: 15,
    }),
    db.query.setorEkspedisi.findMany({
      where: (setorEkspedisi, { eq }) =>
        eq(setorEkspedisi.nasabahId, nasabahData.id),
      orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.createdAt)],
      limit: 15,
      with: {
        ekpedisi: {
          columns: { nama: true, noTelp: true, alamat: true },
        },
      },
    }),
  ]);

  return {
    nasabah: nasabahData,
    setorLangsung: setorLangsungList,
    setorEkspedisi: setorEkspedisiList,
  };
}
