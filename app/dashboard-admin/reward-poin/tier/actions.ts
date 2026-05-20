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

export async function getTiersData() {
  await checkAdminAuth();
  const tiers = await prisma.tierKupon.findMany({
    orderBy: { poinMin: "desc" },
  });
  return tiers;
}

export async function updateTier(
  id: string,
  data: {
    poinMin: number;
    nama: string;
    deskripsi: string;
  },
) {
  await checkAdminAuth();
  try {
    const updated = await prisma.tierKupon.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard-admin/reward-poin/tier");
    revalidatePath("/dashboard-konsumen/tukar-kupon");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update tier:", error);
    return { success: false, error: "Gagal memperbarui konfigurasi tier" };
  }
}
