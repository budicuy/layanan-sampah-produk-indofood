"use server";

import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getTabunganData() {
  await checkAdminAuth();
  return await prisma.nasabah.findMany({
    orderBy: { poin: "desc" },
    include: {
      user: {
        select: { name: true, role: true },
      },
      setorLangsung: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      setorEkspedisi: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          ekpedisi: { select: { alamat: true, noTelp: true } },
        },
      },
      mutasiSaldo: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}
