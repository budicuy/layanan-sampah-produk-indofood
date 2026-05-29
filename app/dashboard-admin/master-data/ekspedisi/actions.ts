"use server";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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

export async function getEkpedisiData(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  await checkAdminAuth();

  if (!params) {
    const data = await db
      .select()
      .from(ekpedisi)
      .orderBy(desc(ekpedisi.updatedAt));
    return { ekpedisi: data, total: data.length, totalRecords: data.length };
  }

  const { page = 1, pageSize = 10, searchTerm } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(
      or(
        ilike(ekpedisi.nama, term),
        ilike(ekpedisi.alamat, term),
        ilike(ekpedisi.noTelp, term),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [statsRes] = await db
    .select({ total: sql<number>`count(*)` })
    .from(ekpedisi);

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ekpedisi)
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  const data = await db
    .select()
    .from(ekpedisi)
    .where(whereClause)
    .orderBy(desc(ekpedisi.updatedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    ekpedisi: data,
    total: totalFiltered,
    totalRecords: Number(statsRes?.total || 0),
  };
}
