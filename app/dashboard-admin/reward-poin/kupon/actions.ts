"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { kupon } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getClaimedCouponsData() {
  await checkAdminAuth();
  const data = await db.query.kupon.findMany({
    with: {
      nasabah: {
        with: {
          user: {
            columns: {
              name: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: (kupon, { desc }) => [desc(kupon.createdAt)],
  });
  return data;
}

export async function markCouponAsUsed(id: string) {
  await checkAdminAuth();
  try {
    const [updated] = await db
      .update(kupon)
      .set({
        status: "DIGUNAKAN",
        digunakanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kupon.id, id))
      .returning();
    revalidatePath("/dashboard-admin/reward-poin/kupon");
    revalidatePath("/dashboard-konsumen/tukar-kupon");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update coupon status:", error);
    return { success: false, error: "Gagal memperbarui status kupon" };
  }
}
