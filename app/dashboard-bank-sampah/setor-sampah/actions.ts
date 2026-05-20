"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import type { JenisSampah } from "@/prisma/generated/prisma/client";

// Bank sampah submit setor langsung (tanpa alamat penjemputan)
export async function submitSetorLangsung(data: {
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  keterangan?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const nasabah = await prisma.nasabah.findUnique({
    where: { userId: session.user.sub },
  });

  if (!nasabah) {
    throw new Error(
      "Profil nasabah belum terdaftar. Hubungi admin untuk mendaftarkan akun Anda.",
    );
  }

  await prisma.setorSampah.create({
    data: {
      nasabahId: nasabah.id,
      jenisSampah: data.jenisSampah,
      beratEstimasi: data.beratEstimasi,
      keterangan: data.keterangan,
      alamatPenjemputan: "-", // Setor langsung — tidak ada penjemputan
      jenisSetor: "LANGSUNG",
      status: "MENUNGGU_VERIFIKASI",
    },
  });

  revalidatePath("/dashboard-bank-sampah/setor-sampah");
}

export async function getSetorSampahBankSampahData() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user.sub;
  const nasabah = await prisma.nasabah.findUnique({
    where: { userId },
    include: {
      setorSampah: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return { nasabah };
}
