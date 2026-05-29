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

  // Fetch overall statistics for the cards
  const [langsungStats, ekspedisiStats] = await Promise.all([
    db
      .select({
        beratEstimasi: setorLangsung.beratEstimasi,
        beratAktual: setorLangsung.beratAktual,
        totalPoin: setorLangsung.totalPoin,
      })
      .from(setorLangsung)
      .where(eq(setorLangsung.nasabahId, nasabahData.id)),
    db
      .select({
        beratEstimasi: setorEkspedisi.beratEstimasi,
        beratAktual: setorEkspedisi.beratAktual,
        totalPoin: setorEkspedisi.totalPoin,
      })
      .from(setorEkspedisi)
      .where(eq(setorEkspedisi.nasabahId, nasabahData.id)),
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
