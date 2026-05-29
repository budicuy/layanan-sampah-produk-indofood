"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { nasabah, setorEkspedisi, setorLangsung, user } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getTabunganData(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filterKategori?: string;
}) {
  await checkAdminAuth();

  if (!params) {
    const data = await db.query.nasabah.findMany({
      orderBy: (nasabah, { desc }) => [desc(nasabah.poin)],
      with: {
        user: {
          columns: { name: true, role: true },
        },
        setorLangsung: {
          orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
          limit: 10,
        },
        setorEkspedisi: {
          orderBy: (setorEkspedisi, { desc }) => [
            desc(setorEkspedisi.createdAt),
          ],
          limit: 10,
          with: {
            ekpedisi: {
              columns: { alamat: true, noTelp: true },
            },
          },
        },
        mutasiSaldo: {
          orderBy: (mutasiSaldo, { desc }) => [desc(mutasiSaldo.createdAt)],
          limit: 20,
        },
      },
    });

    const mapped = data.map((nasabah) => {
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

    return {
      data: mapped,
      total: mapped.length,
      stats: {
        totalPoin: 0,
        totalSaldo: 0,
        totalSetoranSelesai: 0,
        nasabahAktif: 0,
      },
    };
  }

  const { page = 1, pageSize = 10, searchTerm, filterKategori } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(nasabah.nik, term),
        ilike(nasabah.noRek, term),
      ),
    );
  }

  if (filterKategori && filterKategori !== "ALL") {
    conditions.push(
      eq(
        nasabah.kategori,
        filterKategori as "BANK_SAMPAH" | "WARMIENDO" | "PERORANGAN",
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Aggregate stats in server
  const [poinSaldoRes] = await db
    .select({
      totalPoin: sql<number>`sum(poin)`,
      totalSaldo: sql<number>`sum(saldo)`,
    })
    .from(nasabah);

  const [setorLangsungCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(setorLangsung)
    .where(eq(setorLangsung.status, "SELESAI"));

  const [setorEkspedisiCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(setorEkspedisi)
    .where(eq(setorEkspedisi.status, "SELESAI"));

  const [activeNasabahRes] = await db
    .select({ count: sql<number>`count(distinct ${nasabah.id})` })
    .from(nasabah)
    .leftJoin(setorLangsung, eq(nasabah.id, setorLangsung.nasabahId))
    .leftJoin(setorEkspedisi, eq(nasabah.id, setorEkspedisi.nasabahId))
    .where(
      or(
        sql`${setorLangsung.id} is not null`,
        sql`${setorEkspedisi.id} is not null`,
      ),
    );

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(nasabah)
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  // Get filtered IDs first
  const filteredIdsRows = await db
    .select({ id: nasabah.id })
    .from(nasabah)
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(nasabah.poin))
    .limit(pageSize)
    .offset(offset);

  const filteredIds = filteredIdsRows.map((r) => r.id);

  let data: Awaited<ReturnType<typeof db.query.nasabah.findMany>> = [];
  if (filteredIds.length > 0) {
    data = await db.query.nasabah.findMany({
      where: inArray(nasabah.id, filteredIds),
      orderBy: (nasabah, { desc }) => [desc(nasabah.poin)],
      with: {
        user: {
          columns: { name: true, role: true },
        },
        setorLangsung: {
          orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
          limit: 10,
        },
        setorEkspedisi: {
          orderBy: (setorEkspedisi, { desc }) => [
            desc(setorEkspedisi.createdAt),
          ],
          limit: 10,
          with: {
            ekpedisi: {
              columns: { alamat: true, noTelp: true },
            },
          },
        },
        mutasiSaldo: {
          orderBy: (mutasiSaldo, { desc }) => [desc(mutasiSaldo.createdAt)],
          limit: 20,
        },
      },
    });
  }

  const mappedData = data.map((nasabah) => {
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

  return {
    data: mappedData,
    total: totalFiltered,
    stats: {
      totalPoin: Number(poinSaldoRes?.totalPoin || 0),
      totalSaldo: Number(poinSaldoRes?.totalSaldo || 0),
      totalSetoranSelesai:
        Number(setorLangsungCount?.count || 0) +
        Number(setorEkspedisiCount?.count || 0),
      nasabahAktif: Number(activeNasabahRes?.count || 0),
    },
  };
}
