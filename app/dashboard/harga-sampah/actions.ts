"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

export async function createHargaSampah(data: {
  harga: number;
  bulan: Date;
  jenisSampah: JenisSampah;
  berat: number;
}) {
  try {
    await prisma.hargaSampah.create({
      data,
    });
    revalidatePath("/dashboard/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to create harga sampah:", error);
    return { success: false, error: "Gagal menambahkan data harga sampah" };
  }
}

export async function updateHargaSampah(
  id: string,
  data: {
    harga: number;
    bulan: Date;
    jenisSampah: JenisSampah;
    berat: number;
  },
) {
  try {
    await prisma.hargaSampah.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to update harga sampah:", error);
    return { success: false, error: "Gagal memperbarui data harga sampah" };
  }
}

export async function deleteHargaSampah(id: string) {
  try {
    await prisma.hargaSampah.delete({
      where: { id },
    });
    revalidatePath("/dashboard/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete harga sampah:", error);
    return { success: false, error: "Gagal menghapus data harga sampah" };
  }
}
