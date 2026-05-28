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
  const nasabahs = await prisma.nasabah.findMany({
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

  return nasabahs.map((nasabah) => {
    const combinedSetor = [
      ...nasabah.setorLangsung.map((s) => ({
        ...s,
        jenisSetor: "LANGSUNG" as const,
        ekpedisi: null,
      })),
      ...nasabah.setorEkspedisi.map((s) => ({
        ...s,
        jenisSetor: "EKSPEDISI" as const,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      ...nasabah,
      setorSampah: combinedSetor,
    };
  });
}
