"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import {
  kupon,
  nasabah,
  pencairan,
  setorEkspedisi,
  setorLangsung,
  user,
} from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getLaporanStats() {
  await checkAdminAuth();

  // 1. Setoran Stats & Charts
  const [setorLangsungData, setorEkspedisiData] = await Promise.all([
    db.query.setorLangsung.findMany({
      where: (setorLangsung, { eq }) => eq(setorLangsung.status, "SELESAI"),
      orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.selesaiAt)],
    }),
    db.query.setorEkspedisi.findMany({
      where: (setorEkspedisi, { eq }) => eq(setorEkspedisi.status, "SELESAI"),
      orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.selesaiAt)],
    }),
  ]);

  const setoranAll = [
    ...setorLangsungData.map((s) => ({ ...s, jenisSetor: "LANGSUNG" })),
    ...setorEkspedisiData.map((s) => ({ ...s, jenisSetor: "EKSPEDISI" })),
  ];

  // 2. Pencairan Stats
  const [pencairanStatsRes] = await db
    .select({
      totalCairNominal: sql<number>`sum(case when ${pencairan.status} = 'DICAIRKAN' then ${pencairan.jumlah} else 0 end)`,
      totalDiajukanNominal: sql<number>`sum(case when ${pencairan.status} = 'DIAJUKAN' or ${pencairan.status} = 'DIVERIFIKASI' then ${pencairan.jumlah} else 0 end)`,
      totalTransCair: sql<number>`count(case when ${pencairan.status} = 'DICAIRKAN' then 1 end)`,
      totalTransPending: sql<number>`count(case when ${pencairan.status} = 'DIAJUKAN' or ${pencairan.status} = 'DIVERIFIKASI' then 1 end)`,
    })
    .from(pencairan);

  // 3. Kupon Stats
  const [kuponStatsRes] = await db
    .select({
      totalKuponDitukar: sql<number>`count(*)`,
      totalPoinTukar: sql<number>`sum(${kupon.poinCost})`,
      totalKuponAktif: sql<number>`count(case when ${kupon.status} = 'AKTIF' then 1 end)`,
      totalKuponDigunakan: sql<number>`count(case when ${kupon.status} = 'DIGUNAKAN' then 1 end)`,
    })
    .from(kupon);

  const nasabahUnik = new Set(setoranAll.map((s) => s.nasabahId)).size;

  return {
    setoranStats: {
      totalBerat: setoranAll.reduce(
        (acc, s) => acc + (s.beratAktual ?? s.beratEstimasi),
        0,
      ),
      totalPoin: setoranAll.reduce((acc, s) => acc + (s.totalPoin ?? 0), 0),
      jumlahSelesai: setoranAll.length,
      nasabahUnik,
      rawSetoran: setoranAll.map((s) => ({
        selesaiAt: s.selesaiAt,
        createdAt: s.createdAt,
        jenisSampah: s.jenisSampah,
        beratAktual: s.beratAktual,
        beratEstimasi: s.beratEstimasi,
      })),
    },
    pencairanStats: {
      totalCairNominal: Number(pencairanStatsRes?.totalCairNominal || 0),
      totalDiajukanNominal: Number(
        pencairanStatsRes?.totalDiajukanNominal || 0,
      ),
      totalTransCair: Number(pencairanStatsRes?.totalTransCair || 0),
      totalTransPending: Number(pencairanStatsRes?.totalTransPending || 0),
      totalCount:
        Number(pencairanStatsRes?.totalTransCair || 0) +
        Number(pencairanStatsRes?.totalTransPending || 0),
    },
    kuponStats: {
      totalKuponDitukar: Number(kuponStatsRes?.totalKuponDitukar || 0),
      totalPoinTukar: Number(kuponStatsRes?.totalPoinTukar || 0),
      totalKuponAktif: Number(kuponStatsRes?.totalKuponAktif || 0),
      totalKuponDigunakan: Number(kuponStatsRes?.totalKuponDigunakan || 0),
    },
  };
}

export async function getLaporanSetoran(params: {
  page: number;
  pageSize: number;
  search: string;
}) {
  await checkAdminAuth();
  const { page, pageSize, search } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(nasabah.nik, term),
        ilike(setorLangsung.jenisSampah, term),
      ),
    );
  }

  const whereClauseLangsung =
    conditions.length > 0
      ? and(eq(setorLangsung.status, "SELESAI"), ...conditions)
      : eq(setorLangsung.status, "SELESAI");
  const whereClauseEkspedisi =
    conditions.length > 0
      ? and(eq(setorEkspedisi.status, "SELESAI"), ...conditions)
      : eq(setorEkspedisi.status, "SELESAI");

  // Load IDs and sorts
  const [langsungRows, ekspedisiRows] = await Promise.all([
    db
      .select({
        id: setorLangsung.id,
        selesaiAt: setorLangsung.selesaiAt,
        createdAt: setorLangsung.createdAt,
      })
      .from(setorLangsung)
      .leftJoin(nasabah, eq(setorLangsung.nasabahId, nasabah.id))
      .leftJoin(user, eq(nasabah.userId, user.id))
      .where(whereClauseLangsung),
    db
      .select({
        id: setorEkspedisi.id,
        selesaiAt: setorEkspedisi.selesaiAt,
        createdAt: setorEkspedisi.createdAt,
      })
      .from(setorEkspedisi)
      .leftJoin(nasabah, eq(setorEkspedisi.nasabahId, nasabah.id))
      .leftJoin(user, eq(nasabah.userId, user.id))
      .where(whereClauseEkspedisi),
  ]);

  const combined = [
    ...langsungRows.map((r) => ({
      id: r.id,
      selesaiAt: r.selesaiAt,
      createdAt: r.createdAt,
      jenis: "LANGSUNG" as const,
    })),
    ...ekspedisiRows.map((r) => ({
      id: r.id,
      selesaiAt: r.selesaiAt,
      createdAt: r.createdAt,
      jenis: "EKSPEDISI" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(b.selesaiAt ?? b.createdAt).getTime() -
      new Date(a.selesaiAt ?? a.createdAt).getTime(),
  );

  const total = combined.length;
  const paginatedIds = combined.slice(offset, offset + pageSize);

  const langsungIds = paginatedIds
    .filter((p) => p.jenis === "LANGSUNG")
    .map((p) => p.id);
  const ekspedisiIds = paginatedIds
    .filter((p) => p.jenis === "EKSPEDISI")
    .map((p) => p.id);

  const [langsungData, ekspedisiData] = await Promise.all([
    langsungIds.length > 0
      ? db.query.setorLangsung.findMany({
          where: inArray(setorLangsung.id, langsungIds),
          with: {
            nasabah: {
              columns: { id: true, nik: true, kategori: true },
              with: { user: { columns: { name: true } } },
            },
          },
        })
      : [],
    ekspedisiIds.length > 0
      ? db.query.setorEkspedisi.findMany({
          where: inArray(setorEkspedisi.id, ekspedisiIds),
          with: {
            nasabah: {
              columns: { id: true, nik: true, kategori: true },
              with: { user: { columns: { name: true } } },
            },
            ekpedisi: { columns: { alamat: true, noTelp: true } },
          },
        })
      : [],
  ]);

  const mapped = [
    ...langsungData.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    })),
    ...ekspedisiData.map((s) => ({ ...s, jenisSetor: "EKSPEDISI" as const })),
  ].sort(
    (a, b) =>
      new Date(b.selesaiAt ?? b.createdAt).getTime() -
      new Date(a.selesaiAt ?? a.createdAt).getTime(),
  );

  return { data: mapped, total };
}

export async function getLaporanPencairan(params: {
  page: number;
  pageSize: number;
  search: string;
}) {
  await checkAdminAuth();
  const { page, pageSize, search } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(nasabah.nik, term),
        ilike(pencairan.status, term),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pencairan)
    .leftJoin(nasabah, eq(pencairan.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const total = Number(countRes?.count || 0);

  const filteredIdsRows = await db
    .select({ id: pencairan.id })
    .from(pencairan)
    .leftJoin(nasabah, eq(pencairan.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(pencairan.createdAt))
    .limit(pageSize)
    .offset(offset);

  const filteredIds = filteredIdsRows.map((r) => r.id);

  let data: Awaited<ReturnType<typeof db.query.pencairan.findMany>> = [];
  if (filteredIds.length > 0) {
    data = await db.query.pencairan.findMany({
      where: inArray(pencairan.id, filteredIds),
      orderBy: (pencairan, { desc }) => [desc(pencairan.createdAt)],
      with: {
        nasabah: {
          columns: { id: true, nik: true },
          with: { user: { columns: { name: true, username: true } } },
        },
      },
    });
  }

  return { data, total };
}

export async function getLaporanKupon(params: {
  page: number;
  pageSize: number;
  search: string;
}) {
  await checkAdminAuth();
  const { page, pageSize, search } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(user.name, term),
        ilike(kupon.kode, term),
        ilike(kupon.nama, term),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(kupon)
    .leftJoin(nasabah, eq(kupon.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const total = Number(countRes?.count || 0);

  const filteredIdsRows = await db
    .select({ id: kupon.id })
    .from(kupon)
    .leftJoin(nasabah, eq(kupon.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(kupon.createdAt))
    .limit(pageSize)
    .offset(offset);

  const filteredIds = filteredIdsRows.map((r) => r.id);

  let data: Awaited<ReturnType<typeof db.query.kupon.findMany>> = [];
  if (filteredIds.length > 0) {
    data = await db.query.kupon.findMany({
      where: inArray(kupon.id, filteredIds),
      orderBy: (kupon, { desc }) => [desc(kupon.createdAt)],
      with: {
        nasabah: {
          columns: { id: true, nik: true },
          with: { user: { columns: { name: true } } },
        },
      },
    });
  }

  return { data, total };
}
