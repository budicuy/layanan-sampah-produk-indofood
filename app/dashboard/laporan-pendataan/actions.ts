"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

export async function createLaporan(data: {
  nasabahId: string;
  jenisSampah: JenisSampah;
  berat: number;
  produkId?: string | null;
}) {
  try {
    await prisma.laporanPendataan.create({
      data,
    });
    revalidatePath("/dashboard/laporan-pendataan");
    return { success: true };
  } catch (error) {
    console.error("Failed to create laporan:", error);
    return { success: false, error: "Gagal menambahkan data laporan" };
  }
}

export async function updateLaporan(
  id: string,
  data: {
    nasabahId: string;
    jenisSampah: JenisSampah;
    berat: number;
    produkId?: string | null;
  },
) {
  try {
    await prisma.laporanPendataan.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/laporan-pendataan");
    return { success: true };
  } catch (error) {
    console.error("Failed to update laporan:", error);
    return { success: false, error: "Gagal memperbarui data laporan" };
  }
}

export async function deleteLaporan(id: string) {
  try {
    await prisma.laporanPendataan.delete({
      where: { id },
    });
    revalidatePath("/dashboard/laporan-pendataan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete laporan:", error);
    return { success: false, error: "Gagal menghapus data laporan" };
  }
}
