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

export async function getClaimedCouponsData() {
  await checkAdminAuth();
  const kupons = await prisma.kupon.findMany({
    include: {
      nasabah: {
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return kupons;
}

export async function markCouponAsUsed(id: string) {
  await checkAdminAuth();
  try {
    const updated = await prisma.kupon.update({
      where: { id },
      data: {
        status: "DIGUNAKAN",
        digunakanAt: new Date(),
      },
    });
    revalidatePath("/dashboard-admin/reward-poin/kupon");
    revalidatePath("/dashboard-konsumen/tukar-kupon");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update coupon status:", error);
    return { success: false, error: "Gagal memperbarui status kupon" };
  }
}
