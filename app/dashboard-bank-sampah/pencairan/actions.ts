"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { pencairan } from "@/lib/db/schema";

async function checkBankSampahAuth() {
  const session = await getSession();
  if (!session || session.user.role !== "BANK_SAMPAH") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getNasabahSaldo() {
  const session = await checkBankSampahAuth();
  const data = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true, saldo: true, poin: true },
  });
  return data;
}

export async function getPencairanList() {
  const session = await checkBankSampahAuth();
  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true },
  });
  if (!nasabahData) return [];

  return db.query.pencairan.findMany({
    where: (pencairan, { eq }) => eq(pencairan.nasabahId, nasabahData.id),
    orderBy: (pencairan, { desc }) => [desc(pencairan.createdAt)],
  });
}

export async function ajukanPencairan(formData: FormData) {
  const session = await checkBankSampahAuth();

  const jumlah = Number(formData.get("jumlah"));
  const catatan = String(formData.get("catatan") || "");

  if (!jumlah || jumlah < 50000 || jumlah % 50000 !== 0) {
    throw new Error(
      "Jumlah pencairan harus kelipatan Rp 50.000, minimal Rp 50.000",
    );
  }

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true, saldo: true },
  });

  if (!nasabahData) throw new Error("Data nasabah tidak ditemukan");
  if (nasabahData.saldo < jumlah) throw new Error("Saldo tidak mencukupi");

  await db.insert(pencairan).values({
    id: crypto.randomUUID(),
    nasabahId: nasabahData.id,
    jumlah,
    catatan: catatan || null,
    status: "DIAJUKAN",
  });

  revalidatePath("/dashboard-bank-sampah/pencairan");
  return { success: true };
}
