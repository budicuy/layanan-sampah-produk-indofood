"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { JenisProduk } from "@/prisma/generated/prisma/client";

export async function createProduk(data: {
  kode: string;
  nama: string;
  jenis: JenisProduk;
  berat: number;
  brand: string;
  harga: number;
  isi: number;
}) {
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
    jenis: JenisProduk;
    berat: number;
    brand: string;
    harga: number;
    isi: number;
  },
) {
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
