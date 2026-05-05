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

export async function createProduk(data: {
  kode: string;
  nama: string;
  jenis: JenisSampah;
  berat: number;
  brand: string;
  harga: number;
  isi: number;
}) {
  await checkAdminAuth();
  try {
    await prisma.produk.create({
      data,
    });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (error) {
    console.error("Failed to create produk:", error);
    return { success: false, error: "Gagal menambahkan data produk" };
  }
}

export async function updateProduk(
  id: string,
  data: {
    kode: string;
    nama: string;
    jenis: JenisSampah;
    berat: number;
    brand: string;
    harga: number;
    isi: number;
  },
) {
  await checkAdminAuth();
  try {
    await prisma.produk.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (error) {
    console.error("Failed to update produk:", error);
    return { success: false, error: "Gagal memperbarui data produk" };
  }
}

export async function deleteProduk(id: string) {
  await checkAdminAuth();
  try {
    await prisma.produk.delete({
      where: { id },
    });
    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete produk:", error);
    return { success: false, error: "Gagal menghapus data produk" };
  }
}
