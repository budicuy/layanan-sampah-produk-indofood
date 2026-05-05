"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

// Konsumen submit setor sampah
export async function submitSetorSampah(data: {
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  keterangan?: string;
  alamatPenjemputan: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Cari nasabah yang terhubung ke user ini
  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.id },
  });

  if (!nasabah) {
    throw new Error(
      "Profil nasabah belum terdaftar. Hubungi admin untuk mendaftarkan akun Anda.",
    );
  }

  await prisma.setorSampah.create({
    data: {
      nasabahId: nasabah.id,
      jenisSampah: data.jenisSampah,
      beratEstimasi: data.beratEstimasi,
      keterangan: data.keterangan,
      alamatPenjemputan: data.alamatPenjemputan,
      status: "MENUNGGU_VERIFIKASI",
    },
  });

  revalidatePath("/konsumen/setor-sampah");
}

// Konsumen konfirmasi sudah menyerahkan sampah ke kurir
export async function konfirmasiSerahTerima(setorSampahId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.id },
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

  revalidatePath("/konsumen/setor-sampah");
}
