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

/** Analisis gambar AI, upload ke R2, return metadata untuk disimpan ke DB */
async function prepareSubmission(data: SubmitBaseData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
  });
  if (!nasabahData)
    throw new Error("Profil nasabah belum terdaftar. Hubungi admin.");

  // 1. Analisis gambar timbangan via AI
  const scaleBuffer = Buffer.from(data.gambarTimbanganBase64, "base64");
  let statusValidasi = "PERLU_REVIEW";
  let beratTerbacaKg: number | null = null;

  try {
    const analysis = await analyzeScaleImage(
      scaleBuffer,
      data.gambarTimbanganMime,
    );
    if (!analysis.terbaca) {
      throw new Error(
        `Gambar timbangan tidak terdeteksi: ${analysis.alasan_gagal || "Ambil gambar yang lebih jelas."}`,
      );
    }
    const rawWeight = analysis.berat_terbaca ?? 0;
    const unit = (analysis.satuan || "").toLowerCase();
    beratTerbacaKg =
      unit === "gram" || unit === "g" || unit === "gr" || unit === "grams"
        ? rawWeight / 1000
        : rawWeight;

    if (Math.abs(beratTerbacaKg - data.beratEstimasi) <= 0.1) {
      statusValidasi = "VALID";
    } else {
      throw new Error(
        `Gambar timbangan tidak sesuai: input ${data.beratEstimasi} kg, AI terdeteksi ${beratTerbacaKg.toFixed(2)} kg. Selisih maks 100 gram.`,
      );
    }
  } catch (err) {
    console.warn("⚠️ AI Validation error:", err);
    if (
      err instanceof Error &&
      (err.message.startsWith("Gambar timbangan tidak terdeteksi") ||
        err.message.startsWith("Gambar timbangan tidak sesuai"))
    ) {
      throw err;
    }
    statusValidasi = "PERLU_REVIEW";
  }

  // 2. Upload gambar ke R2
  const scaleUrl = await uploadToR2(
    scaleBuffer,
    data.gambarTimbanganMime,
    "setor-sampah",
  );
  const proofUrls: string[] = [];
  for (let i = 0; i < data.gambarBuktiBase64List.length; i++) {
    const buf = Buffer.from(data.gambarBuktiBase64List[i], "base64");
    proofUrls.push(
      await uploadToR2(
        buf,
        data.gambarBuktiMimeList[i] || "image/jpeg",
        "setor-sampah",
      ),
    );
  }

  return {
    nasabah: nasabahData,
    scaleUrl,
    proofUrls,
    statusValidasi,
    beratTerbacaKg,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SETOR LANGSUNG
// ═══════════════════════════════════════════════════════════════════

export async function submitSetorLangsung(data: SubmitBaseData) {
  try {
    const {
      nasabah: nsb,
      scaleUrl,
      proofUrls,
      statusValidasi,
      beratTerbacaKg,
    } = await prepareSubmission(data);

    if (statusValidasi === "VALID") {
      const hargaDB = await db.query.hargaSampah.findFirst({
        where: (hargaSampah, { eq }) =>
          eq(hargaSampah.jenisSampah, data.jenisSampah),
        orderBy: (hargaSampah, { desc }) => [desc(hargaSampah.bulan)],
      });
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
          statusValidasi,
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
    } else {
      await db.insert(setorLangsung).values({
        id: crypto.randomUUID(),
        nasabahId: nsb.id,
        jenisSampah: data.jenisSampah,
        beratEstimasi: data.beratEstimasi,
        keterangan: data.keterangan || null,
        gambarTimbangan: scaleUrl,
        gambarBukti: proofUrls,
        statusValidasi,
        beratTerbaca: beratTerbacaKg,
        status: "MENUNGGU_VERIFIKASI",
      });
    }

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
    const {
      nasabah: nsb,
      scaleUrl,
      proofUrls,
      statusValidasi,
      beratTerbacaKg,
    } = await prepareSubmission(data);

    await db.insert(setorEkspedisi).values({
      id: crypto.randomUUID(),
      nasabahId: nsb.id,
      jenisSampah: data.jenisSampah,
      beratEstimasi: data.beratEstimasi,
      keterangan: data.keterangan || null,
      alamatPenjemputan: data.alamatPenjemputan,
      gambarTimbangan: scaleUrl,
      gambarBukti: proofUrls,
      statusValidasi,
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
