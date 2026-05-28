"use server";

import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

export async function getSetorSampahHistory() {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  if (!nasabah) {
    throw new Error("Nasabah profile not found");
  }

  return await prisma.setorSampah.findMany({
    where: { nasabahId: nasabah.id },
    orderBy: { createdAt: "desc" },
    include: {
      ekpedisi: {
        select: {
          nama: true,
          noTelp: true,
          alamat: true,
        },
      },
    },
  });
}
