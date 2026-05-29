"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { kupon, mutasiSaldo, nasabah } from "@/lib/db/schema";

async function getNasabahProfile(userId: string) {
  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, userId),
  });
  if (!nasabahData) {
    throw new Error(
      "Nasabah profile not found. Please contact administration.",
    );
  }
  return nasabahData;
}

export async function getConsumerPointsAndCoupons() {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const nasabahData = await getNasabahProfile(session.user.sub);

  const kupons = await db.query.kupon.findMany({
    where: (kupon, { eq }) => eq(kupon.nasabahId, nasabahData.id),
    orderBy: (kupon, { desc }) => [desc(kupon.createdAt)],
  });

  const tiers = await db.query.tierKupon.findMany({
    orderBy: (tierKupon, { asc }) => [asc(tierKupon.poinMin)],
  });

  return {
    poin: nasabahData.poin,
    kupons,
    tiers,
  };
}

export async function redeemCoupon(tierId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const tier = await db.query.tierKupon.findFirst({
    where: (tierKupon, { eq }) => eq(tierKupon.id, tierId),
  });
  if (!tier) {
    throw new Error("Tier reward tidak ditemukan");
  }

  const nasabahData = await getNasabahProfile(session.user.sub);

  if (nasabahData.poin < tier.poinMin) {
    throw new Error("Poin tidak cukup untuk menukarkan reward tier ini");
  }

  // Generate random coupon code format: SCN-XXXXXX-XXXXXX (alphanumeric uppercase)
  const generateSegment = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();
  const couponCode = `SCN-${generateSegment()}-${generateSegment()}`;

  await db.transaction(async (tx) => {
    // Deduct points (with point safeguard for race conditions)
    const updated = await tx
      .update(nasabah)
      .set({ poin: sql`poin - ${tier.poinMin}`, updatedAt: new Date() })
      .where(
        and(eq(nasabah.id, nasabahData.id), gte(nasabah.poin, tier.poinMin)),
      )
      .returning();

    if (updated.length === 0) {
      throw new Error("Poin Anda tidak mencukupi untuk melakukan penukaran");
    }

    // Create Coupon record
    await tx.insert(kupon).values({
      id: crypto.randomUUID(),
      kode: couponCode,
      nama: `Kupon Tier ${tier.nama}`,
      deskripsi: tier.deskripsi,
      poinCost: tier.poinMin,
      status: "AKTIF",
      nasabahId: nasabahData.id,
    });

    // Create point mutation history
    await tx.insert(mutasiSaldo).values({
      id: crypto.randomUUID(),
      nasabahId: nasabahData.id,
      jumlah: -tier.poinMin,
      keterangan: `Penukaran Kupon Tier ${tier.nama}`,
    });
  });

  revalidatePath("/dashboard-konsumen/tukar-kupon");
  return { success: true, code: couponCode };
}
