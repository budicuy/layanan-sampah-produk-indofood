"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { ekpedisi } from "@/lib/db/schema";

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
    await db.insert(ekpedisi).values({
      id: crypto.randomUUID(),
      ...data,
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
    await db
      .update(ekpedisi)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ekpedisi.id, id));
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
    await db.delete(ekpedisi).where(eq(ekpedisi.id, id));
    revalidatePath("/dashboard-admin/master-data/ekspedisi");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete ekpedisi:", error);
    return { success: false, error: "Gagal menghapus data ekpedisi" };
  }
}

export async function getEkpedisiData() {
  await checkAdminAuth();
  const data = await db
    .select()
    .from(ekpedisi)
    .orderBy(desc(ekpedisi.updatedAt));
  return { ekpedisi: data };
}
