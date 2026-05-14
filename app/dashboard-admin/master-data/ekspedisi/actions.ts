"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function createEkpedisi(data: {
  nama: string;
  noTelp: string;
  alamat: string;
}) {
  await checkAdminAuth();
  try {
    await prisma.ekpedisi.create({
      data,
    });
    revalidatePath("/dashboard-admin/master-data/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to create ekpedisi:", error);
    return { success: false, error: "Gagal menambahkan data ekpedisi" };
  }
}

export async function updateEkpedisi(
  id: string,
  data: {
    nama: string;
    noTelp: string;
    alamat: string;
  },
) {
  await checkAdminAuth();
  try {
    await prisma.ekpedisi.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard-admin/master-data/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to update ekpedisi:", error);
    return { success: false, error: "Gagal memperbarui data ekpedisi" };
  }
}

export async function deleteEkpedisi(id: string) {
  await checkAdminAuth();
  try {
    await prisma.ekpedisi.delete({
      where: { id },
    });
    revalidatePath("/dashboard-admin/master-data/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ekpedisi:", error);
    return { success: false, error: "Gagal menghapus data ekpedisi" };
  }
}

export async function getEkpedisiData() {
  await checkAdminAuth();
  const ekpedisi = await prisma.ekpedisi.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return { ekpedisi };
}
