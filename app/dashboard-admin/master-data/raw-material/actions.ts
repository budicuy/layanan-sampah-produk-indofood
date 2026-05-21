"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized");
  }
}

export async function getRawMaterials() {
  await checkAdminAuth();

  const materials = await prisma.rawMaterial.findMany({
    orderBy: [{ periode: "desc" }, { kategori: "asc" }, { klasifikasi: "asc" }],
  });

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

  await prisma.$transaction(
    items.map((item) =>
      prisma.rawMaterial.upsert({
        where: {
          periode_kategori_klasifikasi: {
            periode: periodDate,
            kategori: item.kategori,
            klasifikasi: item.klasifikasi,
          },
        },
        create: {
          periode: periodDate,
          kategori: item.kategori,
          klasifikasi: item.klasifikasi,
          beratGr: item.beratGr,
          beratKg: item.beratGr / 1000,
        },
        update: {
          beratGr: item.beratGr,
          beratKg: item.beratGr / 1000,
        },
      }),
    ),
  );

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true };
}

export async function updateRawMaterial(id: string, beratGr: number) {
  await checkAdminAuth();

  const updated = await prisma.rawMaterial.update({
    where: { id },
    data: {
      beratGr,
      beratKg: beratGr / 1000,
    },
  });

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true, data: updated };
}

export async function deleteRawMaterial(id: string) {
  await checkAdminAuth();

  await prisma.rawMaterial.delete({
    where: { id },
  });

  revalidatePath("/dashboard-admin/master-data/raw-material");
  return { success: true };
}
