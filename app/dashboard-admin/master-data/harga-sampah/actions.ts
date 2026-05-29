"use server";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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

export async function getHargaSampahData(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filterJenis?: string;
}) {
  await checkAdminAuth();

  if (!params) {
    const data = await db
      .select()
      .from(hargaSampah)
      .orderBy(desc(hargaSampah.bulan));
    return data;
  }

  const { page = 1, pageSize = 10, searchTerm, filterJenis } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(or(ilike(hargaSampah.jenisSampah, term)));
  }

  if (filterJenis && filterJenis !== "ALL") {
    conditions.push(eq(hargaSampah.jenisSampah, filterJenis as JenisSampah));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Single-trip aggregate stats
  const [avgRes] = await db
    .select({
      avgPlastik: sql<number>`avg(harga) filter (where "jenisSampah" = 'PLASTIK')`,
      avgKarton: sql<number>`avg(harga) filter (where "jenisSampah" = 'KARTON')`,
      avgPaperCup: sql<number>`avg(harga) filter (where "jenisSampah" = 'PAPER_CUP')`,
      totalRecords: sql<number>`count(*)`,
    })
    .from(hargaSampah);

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hargaSampah)
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  const data = await db
    .select()
    .from(hargaSampah)
    .where(whereClause)
    .orderBy(desc(hargaSampah.bulan))
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    total: totalFiltered,
    totalRecords: Number(avgRes?.totalRecords || 0),
    averages: {
      plastik: Math.round(Number(avgRes?.avgPlastik || 0)),
      karton: Math.round(Number(avgRes?.avgKarton || 0)),
      paperCup: Math.round(Number(avgRes?.avgPaperCup || 0)),
    },
  };
}
