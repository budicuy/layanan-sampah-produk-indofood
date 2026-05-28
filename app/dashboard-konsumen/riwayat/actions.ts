"use server";

import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

export async function getSetorSampahHistory() {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN")
    throw new Error("Unauthorized");

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
    select: { id: true },
  });
  if (!nasabah) throw new Error("Nasabah profile not found");

  const [setorLangsung, setorEkspedisi] = await Promise.all([
    prisma.setorLangsung.findMany({
      where: { nasabahId: nasabah.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.setorEkspedisi.findMany({
      where: { nasabahId: nasabah.id },
      orderBy: { createdAt: "desc" },
      include: {
        ekpedisi: { select: { nama: true, noTelp: true, alamat: true } },
      },
    }),
  ]);

  // Gabungkan dan tandai jenisSetor untuk tampilan UI
  const combined = [
    ...setorLangsung.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    })),
    ...setorEkspedisi.map((s) => ({ ...s, jenisSetor: "EKSPEDISI" as const })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return combined;
}
