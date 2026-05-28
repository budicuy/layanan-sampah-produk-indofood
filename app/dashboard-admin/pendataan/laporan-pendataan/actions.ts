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

  const [setorLangsung, setorEkspedisi, pencairan, kupon] = await Promise.all([
    // 1a. Setor Langsung selesai
    prisma.setorLangsung.findMany({
      where: { status: "SELESAI" },
      orderBy: { selesaiAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nik: true,
            kategori: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    // 1b. Setor Ekspedisi selesai
    prisma.setorEkspedisi.findMany({
      where: { status: "SELESAI" },
      orderBy: { selesaiAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nik: true,
            kategori: true,
            user: { select: { name: true } },
          },
        },
        ekpedisi: { select: { alamat: true, noTelp: true } },
      },
    }),
    // 2. Semua Pencairan
    prisma.pencairan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nik: true,
            user: { select: { name: true, username: true } },
          },
        },
      },
    }),
    // 3. Semua Kupon
    prisma.kupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nik: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  // Gabungkan setor langsung + ekspedisi, tandai jenisnya
  const setoran = [
    ...setorLangsung.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    })),
    ...setorEkspedisi.map((s) => ({ ...s, jenisSetor: "EKSPEDISI" as const })),
  ].sort(
    (a, b) =>
      new Date(b.selesaiAt ?? b.createdAt).getTime() -
      new Date(a.selesaiAt ?? a.createdAt).getTime(),
  );

  return { setoran, pencairan, kupon };
}
