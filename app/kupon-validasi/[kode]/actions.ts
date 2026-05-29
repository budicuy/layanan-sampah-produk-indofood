"use server";

import { and, eq } from "drizzle-orm";
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
    const updated = await db
      .update(kupon)
      .set({
        status: "DIGUNAKAN",
        digunakanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(kupon.kode, code), eq(kupon.status, "AKTIF")))
      .returning();

    if (updated.length === 0) {
      const exist = await db.query.kupon.findFirst({
        where: (kupon, { eq }) => eq(kupon.kode, code),
      });
      if (!exist) {
        throw new Error("Kupon tidak ditemukan");
      }
      throw new Error("Kupon sudah tidak aktif atau telah digunakan");
    }

    revalidatePath(`/kupon-validasi/${code}`);
    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses kupon";
    return { success: false, error: msg };
  }
}
