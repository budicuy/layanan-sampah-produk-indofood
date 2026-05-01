"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { StatusEkpedisi } from "@/prisma/generated/prisma/client";

export async function createEkpedisi(data: {
  userId?: string | null;
  noTelp: string;
  alamat: string;
  titikLokasi?: string | null;
  status: StatusEkpedisi;
}) {
  try {
    await prisma.ekpedisi.create({
      data,
    });
    revalidatePath("/dashboard/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to create ekpedisi:", error);
    return { success: false, error: "Gagal menambahkan data ekpedisi" };
  }
}

export async function updateEkpedisi(
  id: string,
  data: {
    userId?: string | null;
    noTelp: string;
    alamat: string;
    titikLokasi?: string | null;
    status: StatusEkpedisi;
  },
) {
  try {
    await prisma.ekpedisi.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to update ekpedisi:", error);
    return { success: false, error: "Gagal memperbarui data ekpedisi" };
  }
}

export async function deleteEkpedisi(id: string) {
  try {
    await prisma.ekpedisi.delete({
      where: { id },
    });
    revalidatePath("/dashboard/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ekpedisi:", error);
    return { success: false, error: "Gagal menghapus data ekpedisi" };
  }
}
