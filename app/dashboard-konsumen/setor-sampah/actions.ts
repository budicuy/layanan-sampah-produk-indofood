"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { analyzeScaleImage } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

interface SubmitData {
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  keterangan?: string;
  alamatPenjemputan: string;
  gambarTimbanganBase64: string;
  gambarTimbanganMime: string;
  gambarBuktiBase64List: string[];
  gambarBuktiMimeList: string[];
}

async function processWasteSubmission(
  jenisSetor: "LANGSUNG" | "EKSPEDISI",
  data: SubmitData,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Cari nasabah yang terhubung ke user ini
  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
  });

  if (!nasabah) {
    throw new Error(
      "Profil nasabah belum terdaftar. Hubungi admin untuk mendaftarkan akun Anda.",
    );
  }

  // 1. Analyze scale image
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
        `Gambar timbangan tidak terdeteksi atau tidak jelas: ${
          analysis.alasan_gagal ||
          "Silakan ambil gambar timbangan yang lebih jelas."
        }`,
      );
    }

    const rawWeight = analysis.berat_terbaca ?? 0;
    const unit = (analysis.satuan || "").toLowerCase();
    if (unit === "gram" || unit === "g" || unit === "gr" || unit === "grams") {
      beratTerbacaKg = rawWeight / 1000;
    } else {
      beratTerbacaKg = rawWeight;
    }

    const diff = Math.abs(beratTerbacaKg - data.beratEstimasi);
    if (diff <= 0.1) {
      statusValidasi = "VALID";
    } else {
      throw new Error(
        `Gambar timbangan tidak sesuai: Berat yang diinput (${data.beratEstimasi} kg) berbeda dengan berat yang terdeteksi oleh AI (${beratTerbacaKg.toFixed(2)} kg). Selisih maksimal yang diperbolehkan adalah 100 gram. Silakan periksa kembali input Anda atau unggah gambar yang sesuai.`,
      );
    }
  } catch (err) {
    console.warn("⚠️ AI Validation encountered an error:", err);
    // If it's a validation rejection error, bubble it up so the user corrects the image or input
    if (
      err instanceof Error &&
      (err.message.startsWith("Gambar timbangan tidak terdeteksi") ||
        err.message.startsWith("Gambar timbangan tidak sesuai"))
    ) {
      throw err;
    }
    // Otherwise, it's an API/network error. Fallback to manual validation "PERLU_REVIEW"
    statusValidasi = "PERLU_REVIEW";
  }

  // 2. Upload scale image to R2
  const scaleUrl = await uploadToR2(
    scaleBuffer,
    data.gambarTimbanganMime,
    "setor-sampah",
  );

  // 3. Upload proof images to R2
  const proofUrls: string[] = [];
  for (let i = 0; i < data.gambarBuktiBase64List.length; i++) {
    const proofBuffer = Buffer.from(data.gambarBuktiBase64List[i], "base64");
    const proofUrl = await uploadToR2(
      proofBuffer,
      data.gambarBuktiMimeList[i] || "image/jpeg",
      "setor-sampah",
    );
    proofUrls.push(proofUrl);
  }

  // 4. Save to DB
  if (statusValidasi === "VALID") {
    const hargaDB = await prisma.hargaSampah.findFirst({
      where: { jenisSampah: data.jenisSampah },
      orderBy: { bulan: "desc" },
    });
    const poinPerKg = hargaDB ? hargaDB.point : 0;
    const totalPoin = Math.round(
      (beratTerbacaKg ?? data.beratEstimasi) * poinPerKg,
    );

    await prisma.$transaction(async (tx) => {
      const newSetor = await tx.setorSampah.create({
        data: {
          nasabahId: nasabah.id,
          jenisSampah: data.jenisSampah,
          beratEstimasi: data.beratEstimasi,
          beratAktual: beratTerbacaKg ?? data.beratEstimasi,
          keterangan: data.keterangan,
          alamatPenjemputan: data.alamatPenjemputan,
          jenisSetor,
          gambarTimbangan: scaleUrl,
          gambarBukti: proofUrls,
          statusValidasi,
          beratTerbaca: beratTerbacaKg,
          status: "SELESAI",
          poinPerKg,
          totalPoin,
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
          keterangan: `Setor ${jenisSetor === "LANGSUNG" ? "langsung" : "ekspedisi"} otomatis AI: ${data.jenisSampah} ${(beratTerbacaKg ?? data.beratEstimasi).toFixed(2)} kg`,
          referensiId: newSetor.id,
        },
      });
    });
  } else {
    await prisma.setorSampah.create({
      data: {
        nasabahId: nasabah.id,
        jenisSampah: data.jenisSampah,
        beratEstimasi: data.beratEstimasi,
        keterangan: data.keterangan,
        alamatPenjemputan: data.alamatPenjemputan,
        jenisSetor,
        gambarTimbangan: scaleUrl,
        gambarBukti: proofUrls,
        statusValidasi,
        beratTerbaca: beratTerbacaKg,
        status: "MENUNGGU_VERIFIKASI",
      },
    });
  }
}

// Konsumen submit setor sampah (via Ekspedisi)
export async function submitSetorSampah(data: SubmitData) {
  await processWasteSubmission("EKSPEDISI", data);
  revalidatePath("/dashboard-konsumen/setor-sampah");
  revalidatePath("/dashboard-konsumen");
}

// Konsumen submit setor langsung (tanpa alamat penjemputan)
export async function submitSetorLangsung(
  data: Omit<SubmitData, "alamatPenjemputan">,
) {
  await processWasteSubmission("LANGSUNG", {
    ...data,
    alamatPenjemputan: "-",
  });
  revalidatePath("/dashboard-konsumen/setor-sampah");
  revalidatePath("/dashboard-konsumen");
}

// Konsumen konfirmasi sudah menyerahkan sampah ke kurir
export async function konfirmasiSerahTerima(setorSampahId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
  });
  if (!nasabah) throw new Error("Nasabah tidak ditemukan");

  const setor = await prisma.setorSampah.findFirst({
    where: { id: setorSampahId, nasabahId: nasabah.id },
  });
  if (!setor) throw new Error("Data setor sampah tidak ditemukan");
  if (setor.status !== "DALAM_PENJEMPUTAN") {
    throw new Error("Status tidak valid untuk aksi ini");
  }

  await prisma.setorSampah.update({
    where: { id: setorSampahId },
    data: {
      status: "SUDAH_DISERAHKAN",
      diserahkanAt: new Date(),
    },
  });

  revalidatePath("/dashboard-konsumen/setor-sampah");
  revalidatePath("/dashboard-konsumen");
}

export async function getSetorSampahKonsumenData() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.sub;
  const nasabah = await prisma.nasabah.findUnique({
    where: { userId },
    include: {
      setorSampah: {
        orderBy: { createdAt: "desc" },
        include: { ekpedisi: { select: { noTelp: true, alamat: true } } },
        take: 20,
      },
    },
  });

  return { nasabah };
}
