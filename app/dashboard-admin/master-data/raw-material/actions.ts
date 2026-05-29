"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { rawMaterial } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized");
  }
}

export async function getRawMaterials() {
  await checkAdminAuth();

  const materials = await db
    .select()
    .from(rawMaterial)
    .orderBy(
      desc(rawMaterial.periode),
      asc(rawMaterial.kategori),
      asc(rawMaterial.klasifikasi),
    );

  return materials;
}

export async function createRawMaterials(
  monthYear: string, // Format: "YYYY-MM"
  weights: {
    etiketNN: number;
    etiketGN: number;
    etiketCN: number;
    kartonNN: number;
    kartonGN: number;
    kartonCN: number;
    cupCN: number;
  },
) {
  await checkAdminAuth();

  const [yearStr, monthStr] = monthYear.split("-");
  const periodDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);

  const items = [
    { kategori: "Etiket", klasifikasi: "NN", beratGr: weights.etiketNN },
    { kategori: "Etiket", klasifikasi: "GN", beratGr: weights.etiketGN },
    { kategori: "Etiket", klasifikasi: "CN", beratGr: weights.etiketCN },
    { kategori: "Karton", klasifikasi: "NN", beratGr: weights.kartonNN },
    { kategori: "Karton", klasifikasi: "GN", beratGr: weights.kartonGN },
    { kategori: "Karton", klasifikasi: "CN", beratGr: weights.kartonCN },
    { kategori: "Cup", klasifikasi: "CN", beratGr: weights.cupCN },
  ];

  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .insert(rawMaterial)
        .values({
          id: crypto.randomUUID(),
          periode: periodDate,
          kategori: item.kategori,
          klasifikasi: item.klasifikasi,
          beratGr: item.beratGr,
          beratKg: item.beratGr / 1000,
        })
        .onConflictDoUpdate({
          target: [
            rawMaterial.periode,
            rawMaterial.kategori,
            rawMaterial.klasifikasi,
          ],
          set: {
            beratGr: item.beratGr,
            beratKg: item.beratGr / 1000,
            updatedAt: new Date(),
          },
        });
    }
  });

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true };
}

export async function updateRawMaterial(id: string, beratGr: number) {
  await checkAdminAuth();

  const [updated] = await db
    .update(rawMaterial)
    .set({
      beratGr,
      beratKg: beratGr / 1000,
      updatedAt: new Date(),
    })
    .where(eq(rawMaterial.id, id))
    .returning();

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true, data: updated };
}

export async function deleteRawMaterial(id: string) {
  await checkAdminAuth();

  await db.delete(rawMaterial).where(eq(rawMaterial.id, id));

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true };
}
