"use server";

import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getLaporanData() {
  await checkAdminAuth();

  const setoran = await prisma.setorSampah.findMany({
    where: { status: "SELESAI" },
    orderBy: { selesaiAt: "desc" },
    include: {
      nasabah: {
        select: { id: true, nama: true, nik: true, kategori: true },
      },
      ekpedisi: {
        select: { alamat: true, noTelp: true },
      },
    },
  });

  return setoran;
}
