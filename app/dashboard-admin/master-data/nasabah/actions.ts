"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
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

export async function getNasabahData() {
  await checkAdminAuth();
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
