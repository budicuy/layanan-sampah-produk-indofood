"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { tierKupon } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getTiersData() {
  await checkAdminAuth();
  const tiers = await db
    .select()
    .from(tierKupon)
    .orderBy(desc(tierKupon.poinMin));
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
    const [updated] = await db
      .update(tierKupon)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tierKupon.id, id))
      .returning();
    revalidatePath("/dashboard-admin/reward-poin/tier");
    revalidatePath("/dashboard-konsumen/tukar-kupon");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update tier:", error);
    return { success: false, error: "Gagal memperbarui konfigurasi tier" };
  }
}
