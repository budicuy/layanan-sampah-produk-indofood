"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import type {
  KategoriNasabah,
  StatusNasabah,
} from "@/prisma/generated/prisma/client";

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

  await prisma.nasabah.create({
    data: {
      userId: data.userId,
      alamat: data.alamat,
      noTelp: data.noTelp,
      kategori: data.kategori,
      nik: data.nik,
      noRek: data.noRek,
      jenisBank: data.jenisBank,
      titikLokasi: data.titikLokasi,
      status: data.status,
    },
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

  await prisma.nasabah.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard-admin/master-data/nasabah");
}

export async function deleteNasabah(id: string) {
  await checkAdminAuth();
  await prisma.nasabah.delete({ where: { id } });
  revalidatePath("/dashboard-admin/master-data/nasabah");
}

export async function getNasabahData() {
  await checkAdminAuth();
  const nasabahs = await prisma.nasabah.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, username: true, email: true },
      },
    },
  });
  return nasabahs;
}

export async function getAvailableUsers() {
  await checkAdminAuth();
  const users = await prisma.user.findMany({
    where: {
      role: "KONSUMEN",
      nasabah: null,
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });
  return users;
}
