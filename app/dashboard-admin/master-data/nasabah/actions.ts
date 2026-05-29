"use server";

import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import {
  type KategoriNasabah,
  nasabah,
  type StatusNasabah,
  user,
} from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function createNasabah(data: {
  userId: string;
  alamat: string;
  noTelp: string;
  kategori: KategoriNasabah;
  nik: string;
  noRek: string;
  jenisBank: string;
  titikLokasi?: string;
  status: StatusNasabah;
}) {
  await checkAdminAuth();

  await db.insert(nasabah).values({
    id: crypto.randomUUID(),
    userId: data.userId,
    alamat: data.alamat,
    noTelp: data.noTelp,
    kategori: data.kategori,
    nik: data.nik,
    noRek: data.noRek,
    jenisBank: data.jenisBank,
    titikLokasi: data.titikLokasi || null,
    status: data.status,
  });

  revalidatePath("/dashboard-admin/master-data/nasabah");
}

export async function updateNasabah(
  id: string,
  data: {
    alamat: string;
    noTelp: string;
    kategori: KategoriNasabah;
    nik: string;
    noRek: string;
    jenisBank: string;
    titikLokasi?: string;
    status: StatusNasabah;
  },
) {
  await checkAdminAuth();

  await db
    .update(nasabah)
    .set({
      ...data,
      titikLokasi: data.titikLokasi || null,
      updatedAt: new Date(),
    })
    .where(eq(nasabah.id, id));

  revalidatePath("/dashboard-admin/master-data/nasabah");
}

export async function deleteNasabah(id: string) {
  await checkAdminAuth();
  await db.delete(nasabah).where(eq(nasabah.id, id));
  revalidatePath("/dashboard-admin/master-data/nasabah");
}

export async function getNasabahData(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filterKategori?: string;
  filterStatus?: string;
}) {
  await checkAdminAuth();

  if (!params) {
    const data = await db.query.nasabah.findMany({
      orderBy: (nasabah, { desc }) => [desc(nasabah.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });
    return data;
  }

  const {
    page = 1,
    pageSize = 10,
    searchTerm,
    filterKategori,
    filterStatus,
  } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(user.username, term),
        ilike(nasabah.nik, term),
      ),
    );
  }

  if (filterKategori && filterKategori !== "ALL") {
    conditions.push(eq(nasabah.kategori, filterKategori as KategoriNasabah));
  }

  if (filterStatus && filterStatus !== "ALL") {
    conditions.push(eq(nasabah.status, filterStatus as StatusNasabah));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Aggregate stats in a single db trip
  const [statsRes] = await db
    .select({
      total: sql<number>`count(*)`,
      aktif: sql<number>`count(*) filter (where status = 'AKTIF')`,
      perorangan: sql<number>`count(*) filter (where kategori = 'PERORANGAN')`,
      warmiendo: sql<number>`count(*) filter (where kategori = 'WARMIENDO')`,
      bankSampah: sql<number>`count(*) filter (where kategori = 'BANK_SAMPAH')`,
    })
    .from(nasabah);

  // Total filtered records
  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(nasabah)
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  // Paginated query
  const rows = await db
    .select({
      nasabah: nasabah,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    })
    .from(nasabah)
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(nasabah.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const data = rows.map((row) => ({
    ...row.nasabah,
    user: row.user.id ? row.user : null,
  }));

  return {
    data,
    total: totalFiltered,
    stats: {
      total: Number(statsRes?.total || 0),
      aktif: Number(statsRes?.aktif || 0),
      perorangan: Number(statsRes?.perorangan || 0),
      warmiendo: Number(statsRes?.warmiendo || 0),
      bankSampah: Number(statsRes?.bankSampah || 0),
    },
  };
}

export async function getAvailableUsers() {
  await checkAdminAuth();
  const data = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
    })
    .from(user)
    .leftJoin(nasabah, eq(user.id, nasabah.userId))
    .where(
      and(inArray(user.role, ["KONSUMEN", "BANK_SAMPAH"]), isNull(nasabah.id)),
    );
  return data;
}
