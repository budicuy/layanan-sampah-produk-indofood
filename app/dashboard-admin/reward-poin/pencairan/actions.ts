"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import type { StatusPencairan } from "@/prisma/generated/prisma/enums";

async function checkAdminAuth() {
  const session = await getSession();
  if (
    !session ||
    session.user.role === "KONSUMEN" ||
    session.user.role === "BANK_SAMPAH"
  ) {
    throw new Error("Unauthorized");
  }
}

export async function getPencairanAdminList() {
  await checkAdminAuth();
  return prisma.pencairan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nasabah: {
        include: { user: { select: { name: true, username: true } } },
      },
    },
  });
}

export async function verifikasiPencairan(id: string, catatan: string) {
  await checkAdminAuth();

  await prisma.pencairan.update({
    where: { id },
    data: {
      status: "DIVERIFIKASI",
      catatanAdmin: catatan || null,
      diverifikasi: new Date(),
    },
  });

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}

export async function cairkanPencairan(formData: FormData) {
  await checkAdminAuth();

  const id = String(formData.get("id"));
  const catatanAdmin = String(formData.get("catatanAdmin") || "");
  const fotoFile = formData.get("buktiFoto") as File | null;

  const pencairan = await prisma.pencairan.findUnique({
    where: { id },
    include: { nasabah: true },
  });

  if (!pencairan) throw new Error("Pencairan tidak ditemukan");

  // Foto bukti WAJIB untuk pencairan
  if (!fotoFile || fotoFile.size === 0) {
    throw new Error("Foto bukti transfer wajib diupload sebelum mencairkan.");
  }

  // Validasi ukuran maksimal 60KB (toleransi overhead encoding; kompresi dilakukan di client)
  if (fotoFile.size > 61440) {
    throw new Error(
      `Ukuran foto ${(fotoFile.size / 1024).toFixed(0)}KB melebihi batas. Coba gunakan gambar yang lebih kecil.`,
    );
  }
  const buffer = Buffer.from(await fotoFile.arrayBuffer());
  const buktiFotoUrl = await uploadToR2(buffer, fotoFile.type, "pencairan");

  // Update pencairan menjadi DICAIRKAN dan kurangi saldo nasabah
  await prisma.$transaction([
    prisma.pencairan.update({
      where: { id },
      data: {
        status: "DICAIRKAN",
        catatanAdmin: catatanAdmin || null,
        buktiFoto: buktiFotoUrl,
        dicairkan: new Date(),
      },
    }),
    prisma.nasabah.update({
      where: { id: pencairan.nasabahId },
      data: { saldo: { decrement: pencairan.jumlah } },
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: pencairan.nasabahId,
        jumlah: -pencairan.jumlah,
        keterangan: `Pencairan dana Rp ${pencairan.jumlah.toLocaleString("id-ID")}`,
        referensiId: id,
      },
    }),
  ]);

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}

export async function tolakPencairan(id: string, catatan: string) {
  await checkAdminAuth();

  await prisma.pencairan.update({
    where: { id },
    data: {
      status: "DITOLAK",
      catatanAdmin: catatan || null,
    },
  });

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}
