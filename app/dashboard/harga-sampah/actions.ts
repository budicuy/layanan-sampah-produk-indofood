"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function createHargaSampah(data: {
  harga: number;
  bulan: Date;
  jenisSampah: JenisSampah;
  berat: number;
}) {
  await checkAdminAuth();
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
  await checkAdminAuth();
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
  await checkAdminAuth();
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
