"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { kupon } from "@/lib/db/schema";

export async function getCouponDetails(code: string) {
  try {
    const data = await db.query.kupon.findFirst({
      where: (kupon, { eq }) => eq(kupon.kode, code),
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
    });
    return data || null;
  } catch (error) {
    console.error("Error fetching coupon details:", error);
    return null;
  }
}

export async function claimCoupon(code: string) {
  try {
    const couponItem = await db.query.kupon.findFirst({
      where: (kupon, { eq }) => eq(kupon.kode, code),
    });

    if (!couponItem) {
      throw new Error("Kupon tidak ditemukan");
    }

    if (couponItem.status !== "AKTIF") {
      throw new Error("Kupon sudah tidak aktif atau telah digunakan");
    }

    await db
      .update(kupon)
      .set({
        status: "DIGUNAKAN",
        digunakanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kupon.kode, code));

    revalidatePath(`/kupon-validasi/${code}`);
    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses kupon";
    return { success: false, error: msg };
  }
}
