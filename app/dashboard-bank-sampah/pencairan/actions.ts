"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import type { StatusPencairan } from "@/prisma/generated/prisma/enums";

async function checkBankSampahAuth() {
  const session = await getSession();
  if (!session || session.user.role !== "BANK_SAMPAH") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getNasabahSaldo() {
  const session = await checkBankSampahAuth();
  const nasabah = await prisma.nasabah.findFirst({
    where: { user: { username: session.user.username } },
    select: { id: true, saldo: true, poin: true },
  });
  return nasabah;
}

export async function getPencairanList() {
  const session = await checkBankSampahAuth();
  const nasabah = await prisma.nasabah.findFirst({
    where: { user: { username: session.user.username } },
    select: { id: true },
  });
  if (!nasabah) return [];

  return prisma.pencairan.findMany({
    where: { nasabahId: nasabah.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function ajukanPencairan(formData: FormData) {
  const session = await checkBankSampahAuth();

  const jumlah = Number(formData.get("jumlah"));
  const catatan = String(formData.get("catatan") || "");

  if (!jumlah || jumlah < 50000 || jumlah % 50000 !== 0) {
    throw new Error("Jumlah pencairan harus kelipatan Rp 50.000, minimal Rp 50.000");
  }

  const nasabah = await prisma.nasabah.findFirst({
    where: { user: { username: session.user.username } },
    select: { id: true, saldo: true },
  });

  if (!nasabah) throw new Error("Data nasabah tidak ditemukan");
  if (nasabah.saldo < jumlah) throw new Error("Saldo tidak mencukupi");

  await prisma.pencairan.create({
    data: {
      nasabahId: nasabah.id,
      jumlah,
      catatan: catatan || null,
      status: "DIAJUKAN",
    },
  });

  revalidatePath("/dashboard-bank-sampah/pencairan");
  return { success: true };
}
