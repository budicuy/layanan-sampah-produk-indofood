"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { analyzeScaleImage } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

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

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
  });
  if (!nasabah)
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

  return { nasabah, scaleUrl, proofUrls, statusValidasi, beratTerbacaKg };
}

// ═══════════════════════════════════════════════════════════════════
// SETOR LANGSUNG
// ═══════════════════════════════════════════════════════════════════

export async function submitSetorLangsung(data: SubmitBaseData) {
  try {
    const { nasabah, scaleUrl, proofUrls, statusValidasi, beratTerbacaKg } =
      await prepareSubmission(data);

    if (statusValidasi === "VALID") {
      const hargaDB = await prisma.hargaSampah.findFirst({
        where: { jenisSampah: data.jenisSampah },
        orderBy: { bulan: "desc" },
      });
      const poinPerKg = hargaDB?.point ?? 0;
      const beratFinal = beratTerbacaKg ?? data.beratEstimasi;
      const totalPoin = Math.round(beratFinal * poinPerKg);

      await prisma.$transaction(async (tx) => {
        const newSetor = await tx.setorLangsung.create({
          data: {
            nasabahId: nasabah.id,
            jenisSampah: data.jenisSampah,
            beratEstimasi: data.beratEstimasi,
            beratAktual: beratFinal,
            keterangan: data.keterangan,
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
          },
        });
        await tx.nasabah.update({
          where: { id: nasabah.id },
          data: { poin: { increment: totalPoin } },
        });
        await tx.mutasiSaldo.create({
          data: {
            nasabahId: nasabah.id,
            jumlah: totalPoin,
            keterangan: `Setor langsung (AI) ${data.jenisSampah} ${beratFinal.toFixed(2)} kg`,
            referensiId: newSetor.id,
            jenisReferensi: "LANGSUNG",
          },
        });
      });
    } else {
      await prisma.setorLangsung.create({
        data: {
          nasabahId: nasabah.id,
          jenisSampah: data.jenisSampah,
          beratEstimasi: data.beratEstimasi,
          keterangan: data.keterangan,
          gambarTimbangan: scaleUrl,
          gambarBukti: proofUrls,
          statusValidasi,
          beratTerbaca: beratTerbacaKg,
          status: "MENUNGGU_VERIFIKASI",
        },
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
    const { nasabah, scaleUrl, proofUrls, statusValidasi, beratTerbacaKg } =
      await prepareSubmission(data);

    await prisma.setorEkspedisi.create({
      data: {
        nasabahId: nasabah.id,
        jenisSampah: data.jenisSampah,
        beratEstimasi: data.beratEstimasi,
        keterangan: data.keterangan,
        alamatPenjemputan: data.alamatPenjemputan,
        gambarTimbangan: scaleUrl,
        gambarBukti: proofUrls,
        statusValidasi,
        beratTerbaca: beratTerbacaKg,
        status: "MENUNGGU_VERIFIKASI",
      },
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

    const nasabah = await prisma.nasabah.findUnique({
      where: { userId: session.user.sub },
    });
    if (!nasabah) throw new Error("Nasabah tidak ditemukan");

    const setor = await prisma.setorEkspedisi.findFirst({
      where: { id: setorEkspedisiId, nasabahId: nasabah.id },
    });
    if (!setor) throw new Error("Data setor tidak ditemukan");
    if (setor.status !== "DALAM_PENJEMPUTAN")
      throw new Error("Status tidak valid untuk aksi ini");

    await prisma.setorEkspedisi.update({
      where: { id: setorEkspedisiId },
      data: { status: "SUDAH_DISERAHKAN", diserahkanAt: new Date() },
    });

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

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
    select: { id: true, alamat: true, poin: true, saldo: true },
  });
  if (!nasabah) return { nasabah: null };

  const [setorLangsung, setorEkspedisi] = await Promise.all([
    prisma.setorLangsung.findMany({
      where: { nasabahId: nasabah.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.setorEkspedisi.findMany({
      where: { nasabahId: nasabah.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        ekpedisi: { select: { nama: true, noTelp: true, alamat: true } },
      },
    }),
  ]);

  return { nasabah, setorLangsung, setorEkspedisi };
}
