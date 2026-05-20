"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getCouponDetails(code: string) {
  try {
    const coupon = await prisma.kupon.findUnique({
      where: { kode: code },
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
    });
    return coupon;
  } catch (error) {
    console.error("Error fetching coupon details:", error);
    return null;
  }
}

export async function claimCoupon(code: string) {
  try {
    const coupon = await prisma.kupon.findUnique({
      where: { kode: code },
    });

    if (!coupon) {
      throw new Error("Kupon tidak ditemukan");
    }

    if (coupon.status !== "AKTIF") {
      throw new Error("Kupon sudah tidak aktif atau telah digunakan");
    }

    await prisma.kupon.update({
      where: { kode: code },
      data: {
        status: "DIGUNAKAN",
        digunakanAt: new Date(),
      },
    });

    revalidatePath(`/kupon-validasi/${code}`);
    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses kupon";
    return { success: false, error: msg };
  }
}
