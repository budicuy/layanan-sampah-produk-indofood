"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { hargaSampah, type JenisSampah } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function createHargaSampah(data: {
  harga: number;
  point: number;
  bulan: Date;
  jenisSampah: JenisSampah;
  berat: number;
}) {
  await checkAdminAuth();
  try {
    await db.insert(hargaSampah).values({
      id: crypto.randomUUID(),
      ...data,
    });
    revalidatePath("/dashboard-admin/master-data/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to create harga sampah:", error);
    return { success: false, error: "Gagal menambahkan data harga sampah" };
  }
}

export async function updateHargaSampah(
  id: string,
  data: {
    harga: number;
    point: number;
    bulan: Date;
    jenisSampah: JenisSampah;
    berat: number;
  },
) {
  await checkAdminAuth();
  try {
    await db
      .update(hargaSampah)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(hargaSampah.id, id));
    revalidatePath("/dashboard-admin/master-data/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to update harga sampah:", error);
    return { success: false, error: "Gagal memperbarui data harga sampah" };
  }
}

export async function deleteHargaSampah(id: string) {
  await checkAdminAuth();
  try {
    await db.delete(hargaSampah).where(eq(hargaSampah.id, id));
    revalidatePath("/dashboard-admin/master-data/harga-sampah");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete harga sampah:", error);
    return { success: false, error: "Gagal menghapus data harga sampah" };
  }
}

export async function getHargaSampahData() {
  await checkAdminAuth();
  const data = await db
    .select()
    .from(hargaSampah)
    .orderBy(desc(hargaSampah.bulan));
  return data;
}
