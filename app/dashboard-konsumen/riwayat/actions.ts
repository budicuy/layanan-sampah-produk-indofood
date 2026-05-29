"use server";

import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

export async function getSetorSampahHistory(
  type: "LANGSUNG" | "EKSPEDISI",
  page = 1,
  limit = 20,
) {
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

  // Fetch overall statistics for the cards
  const [langsungStats, ekspedisiStats] = await Promise.all([
    prisma.setorLangsung.findMany({
      where: { nasabahId: nasabah.id },
      select: { beratEstimasi: true, beratAktual: true, totalPoin: true },
    }),
    prisma.setorEkspedisi.findMany({
      where: { nasabahId: nasabah.id },
      select: { beratEstimasi: true, beratAktual: true, totalPoin: true },
    }),
  ]);

  const totalSetoran = langsungStats.length + ekspedisiStats.length;
  let totalPoin = 0;
  let totalBerat = 0;

  for (const s of langsungStats) {
    totalPoin += s.totalPoin ?? 0;
    totalBerat += s.beratAktual ?? s.beratEstimasi;
  }
  for (const s of ekspedisiStats) {
    totalPoin += s.totalPoin ?? 0;
    totalBerat += s.beratAktual ?? s.beratEstimasi;
  }

  // Fetch paginated history list
  let data: {
    id: string;
    nasabahId: string;
    jenisSampah: string;
    beratEstimasi: number;
    beratAktual: number | null;
    status: string;
    poinPerKg: number | null;
    totalPoin: number | null;
    hargaPerKg: number | null;
    totalHarga: number | null;
    selesaiAt: Date | null;
    verifikasiAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    verifiedBy: string | null;
    jenisSetor: "LANGSUNG" | "EKSPEDISI";
    ekpedisi: { nama: string; noTelp: string; alamat: string } | null;
  }[] = [];
  let totalCount = 0;

  if (type === "LANGSUNG") {
    const [list, count] = await Promise.all([
      prisma.setorLangsung.findMany({
        where: { nasabahId: nasabah.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.setorLangsung.count({
        where: { nasabahId: nasabah.id },
      }),
    ]);
    data = list.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    }));
    totalCount = count;
  } else {
    const [list, count] = await Promise.all([
      prisma.setorEkspedisi.findMany({
        where: { nasabahId: nasabah.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ekpedisi: { select: { nama: true, noTelp: true, alamat: true } },
        },
      }),
      prisma.setorEkspedisi.count({
        where: { nasabahId: nasabah.id },
      }),
    ]);
    data = list.map((s) => ({
      ...s,
      jenisSetor: "EKSPEDISI" as const,
    }));
    totalCount = count;
  }

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    totalCount,
    totalPages,
    stats: {
      totalSetoran,
      totalPoin,
      totalBerat,
    },
  };
}
