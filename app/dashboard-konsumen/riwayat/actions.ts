"use server";

import { eq, sql } from "drizzle-orm";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { setorEkspedisi, setorLangsung } from "@/lib/db/schema";

export async function getSetorSampahHistory(
  type: "LANGSUNG" | "EKSPEDISI",
  page = 1,
  limit = 20,
) {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true },
  });
  if (!nasabahData) {
    throw new Error("Nasabah profile not found");
  }

  // Fetch overall statistics for the cards using SQL aggregation
  const [langsungStatsResult, ekspedisiStatsResult] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        totalPoin: sql<number>`sum(coalesce("totalPoin", 0))::int`,
        totalBerat: sql<number>`sum(coalesce("beratAktual", "beratEstimasi"))::float8`,
      })
      .from(setorLangsung)
      .where(eq(setorLangsung.nasabahId, nasabahData.id)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        totalPoin: sql<number>`sum(coalesce("totalPoin", 0))::int`,
        totalBerat: sql<number>`sum(coalesce("beratAktual", "beratEstimasi"))::float8`,
      })
      .from(setorEkspedisi)
      .where(eq(setorEkspedisi.nasabahId, nasabahData.id)),
  ]);

  const langsungStats = langsungStatsResult[0] || {
    count: 0,
    totalPoin: 0,
    totalBerat: 0,
  };
  const ekspedisiStats = ekspedisiStatsResult[0] || {
    count: 0,
    totalPoin: 0,
    totalBerat: 0,
  };

  const totalSetoran = (langsungStats.count ?? 0) + (ekspedisiStats.count ?? 0);
  const totalPoin =
    (langsungStats.totalPoin ?? 0) + (ekspedisiStats.totalPoin ?? 0);
  const totalBerat =
    (langsungStats.totalBerat ?? 0) + (ekspedisiStats.totalBerat ?? 0);

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
    const [list, countResult] = await Promise.all([
      db.query.setorLangsung.findMany({
        where: (setorLangsung, { eq }) =>
          eq(setorLangsung.nasabahId, nasabahData.id),
        orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
        offset: (page - 1) * limit,
        limit: limit,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(setorLangsung)
        .where(eq(setorLangsung.nasabahId, nasabahData.id)),
    ]);
    const count = countResult[0]?.count ?? 0;
    data = list.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    }));
    totalCount = count;
  } else {
    const [list, countResult] = await Promise.all([
      db.query.setorEkspedisi.findMany({
        where: (setorEkspedisi, { eq }) =>
          eq(setorEkspedisi.nasabahId, nasabahData.id),
        orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.createdAt)],
        offset: (page - 1) * limit,
        limit: limit,
        with: {
          ekpedisi: {
            columns: { nama: true, noTelp: true, alamat: true },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(setorEkspedisi)
        .where(eq(setorEkspedisi.nasabahId, nasabahData.id)),
    ]);
    const count = countResult[0]?.count ?? 0;
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
