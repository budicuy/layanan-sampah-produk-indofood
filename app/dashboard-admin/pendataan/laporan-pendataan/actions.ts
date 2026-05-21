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

  const [setoran, pencairan, kupon] = await Promise.all([
    // 1. Setoran selesai
    prisma.setorSampah.findMany({
      where: { status: "SELESAI" },
      orderBy: { selesaiAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nik: true,
            kategori: true,
            user: {
              select: { name: true },
            },
          },
        },
        ekpedisi: {
          select: { alamat: true, noTelp: true },
        },
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
            user: {
              select: { name: true, username: true },
            },
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
            user: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  return { setoran, pencairan, kupon };
}
