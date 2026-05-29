"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { type JenisSampah, setorLangsung } from "@/lib/db/schema";

// Bank sampah submit setor langsung (tanpa AI, tanpa penjemputan)
export async function submitSetorLangsung(data: {
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  keterangan?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
  });
  if (!nasabahData) {
    throw new Error("Profil nasabah belum terdaftar. Hubungi admin.");
  }

  await db.insert(setorLangsung).values({
    id: crypto.randomUUID(),
    nasabahId: nasabahData.id,
    jenisSampah: data.jenisSampah,
    beratEstimasi: data.beratEstimasi,
    keterangan: data.keterangan || null,
    status: "MENUNGGU_VERIFIKASI",
  });

  revalidatePath("/dashboard-bank-sampah/setor-sampah");
}

export async function getSetorSampahBankSampahData() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabahData = await db.query.nasabah.findFirst({
    where: (nasabah, { eq }) => eq(nasabah.userId, session.user.sub),
    columns: { id: true, saldo: true, poin: true, alamat: true },
  });
  if (!nasabahData) return { nasabah: null, setorLangsung: [] };

  const setorLangsungData = await db.query.setorLangsung.findMany({
    where: (setorLangsung, { eq }) =>
      eq(setorLangsung.nasabahId, nasabahData.id),
    orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
    limit: 20,
  });

  return { nasabah: nasabahData, setorLangsung: setorLangsungData };
}
