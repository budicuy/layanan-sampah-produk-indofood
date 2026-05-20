"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function getNasabahProfile(userId: string) {
  const nasabah = await prisma.nasabah.findUnique({
    where: { userId },
  });
  if (!nasabah) {
    throw new Error(
      "Nasabah profile not found. Please contact administration.",
    );
  }
  return nasabah;
}

export async function getConsumerPointsAndCoupons() {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const nasabah = await getNasabahProfile(session.user.sub);

  const kupons = await prisma.kupon.findMany({
    where: { nasabahId: nasabah.id },
    orderBy: { createdAt: "desc" },
  });

  const tiers = await prisma.tierKupon.findMany({
    orderBy: { poinMin: "asc" },
  });

  return {
    poin: nasabah.poin,
    kupons,
    tiers,
  };
}

export async function redeemCoupon(tierId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const tier = await prisma.tierKupon.findUnique({
    where: { id: tierId },
  });
  if (!tier) {
    throw new Error("Tier reward tidak ditemukan");
  }

  const nasabah = await getNasabahProfile(session.user.sub);

  if (nasabah.poin < tier.poinMin) {
    throw new Error("Poin tidak cukup untuk menukarkan reward tier ini");
  }

  // Generate random coupon code format: SCN-XXXXXX-XXXXXX (alphanumeric uppercase)
  const generateSegment = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();
  const couponCode = `SCN-${generateSegment()}-${generateSegment()}`;

  await prisma.$transaction([
    // Deduct points
    prisma.nasabah.update({
      where: { id: nasabah.id },
      data: { poin: { decrement: tier.poinMin } },
    }),
    // Create Coupon record
    prisma.kupon.create({
      data: {
        kode: couponCode,
        nama: `Kupon Tier ${tier.nama}`,
        deskripsi: tier.deskripsi,
        poinCost: tier.poinMin,
        status: "AKTIF",
        nasabahId: nasabah.id,
      },
    }),
    // Create point mutation history
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: nasabah.id,
        jumlah: -tier.poinMin,
        keterangan: `Penukaran Kupon Tier ${tier.nama}`,
      },
    }),
  ]);

  revalidatePath("/dashboard-konsumen/tukar-kupon");
  return { success: true, code: couponCode };
}
