"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { kupon, nasabah, user } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getClaimedCouponsData(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  await checkAdminAuth();

  if (!params) {
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
    return { data, total: data.length };
  }

  const { page = 1, pageSize = 10, searchTerm } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(
      or(
        ilike(kupon.kode, term),
        ilike(kupon.nama, term),
        ilike(user.name, term),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(kupon)
    .leftJoin(nasabah, eq(kupon.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  const filteredIdsRows = await db
    .select({ id: kupon.id })
    .from(kupon)
    .leftJoin(nasabah, eq(kupon.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(kupon.createdAt))
    .limit(pageSize)
    .offset(offset);

  const filteredIds = filteredIdsRows.map((r) => r.id);

  let data: Awaited<ReturnType<typeof db.query.kupon.findMany>> = [];
  if (filteredIds.length > 0) {
    data = await db.query.kupon.findMany({
      where: inArray(kupon.id, filteredIds),
      orderBy: (kupon, { desc }) => [desc(kupon.createdAt)],
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
  }

  return {
    data,
    total: totalFiltered,
  };
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
