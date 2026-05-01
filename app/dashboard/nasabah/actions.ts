"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  KategoriNasabah,
  StatusNasabah,
} from "@/prisma/generated/prisma/client";

export async function createNasabah(data: {
  nama: string;
  alamat: string;
  noTelp: string;
  kategori: KategoriNasabah;
  nik: string;
  noRek: string;
  jenisBank: string;
  titikLokasi?: string;
  status: StatusNasabah;
}) {
  await prisma.nasabah.create({
    data,
  });
  revalidatePath("/dashboard/nasabah");
}

export async function updateNasabah(
  id: string,
  data: {
    nama: string;
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
  await prisma.nasabah.update({
    where: { id },
    data,
  });
  revalidatePath("/dashboard/nasabah");
}

export async function deleteNasabah(id: string) {
  await prisma.nasabah.delete({
    where: { id },
  });
  revalidatePath("/dashboard/nasabah");
}
