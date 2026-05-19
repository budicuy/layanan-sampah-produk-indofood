"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

// ─── Verifikasi awal (admin approve / tolak) ───────────────────────────────

export async function verifikasiSetorSampah(
  setorSampahId: string,
  approve: boolean,
  catatan?: string,
) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  await prisma.setorSampah.update({
    where: { id: setorSampahId },
    data: {
      status: approve ? "TERVERIFIKASI" : "DITOLAK",
      catatanAdmin: catatan,
      verifikasiAt: new Date(),
    },
  });

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}

// ─── Verifikasi & langsung kreditkan saldo (khusus Setor Langsung) ──────────

export async function verifikasiSetorLangsungDanKreditSaldo(
  setorSampahId: string,
  beratAktual: number,
  poinPerKg: number,
  catatan?: string,
) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  const setor = await prisma.setorSampah.findUnique({
    where: { id: setorSampahId },
    include: { nasabah: true },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "MENUNGGU_VERIFIKASI") {
    throw new Error("Status harus MENUNGGU_VERIFIKASI");
  }

  const totalPoin = Math.round(beratAktual * poinPerKg);
  const now = new Date();

  await prisma.$transaction([
    prisma.setorSampah.update({
      where: { id: setorSampahId },
      data: {
        status: "SELESAI",
        beratAktual,
        poinPerKg,
        totalPoin,
        catatanAdmin: catatan,
        verifikasiAt: now,
        selesaiAt: now,
      },
    }),
    prisma.nasabah.update({
      where: { id: setor.nasabahId },
      data: { poin: { increment: totalPoin } },
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: setor.nasabahId,
        jumlah: totalPoin,
        keterangan: `Setor langsung ${setor.jenisSampah} ${beratAktual} kg`,
        referensiId: setorSampahId,
      },
    }),
  ]);

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}

// ─── Tugaskan ekpedisi untuk penjemputan ──────────────────────────────────

export async function tugaskanEkpedisi(
  setorSampahId: string,
  ekpedisiId: string,
) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  const setor = await prisma.setorSampah.findUnique({
    where: { id: setorSampahId },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "TERVERIFIKASI") {
    throw new Error("Status harus TERVERIFIKASI sebelum menugaskan ekpedisi");
  }

  await prisma.setorSampah.update({
    where: { id: setorSampahId },
    data: {
      ekpedisiId,
      status: "DALAM_PENJEMPUTAN",
      penjemputanAt: new Date(),
    },
  });

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}

// ─── Konfirmasi sampah diterima di pusat ──────────────────────────────────

export async function konfirmasiSampahDiterima(setorSampahId: string) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  const setor = await prisma.setorSampah.findUnique({
    where: { id: setorSampahId },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SUDAH_DISERAHKAN") {
    throw new Error("Konsumen belum konfirmasi serah terima");
  }

  await prisma.setorSampah.update({
    where: { id: setorSampahId },
    data: { status: "SAMPAH_DITERIMA" },
  });

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}

// ─── Verifikasi akhir & kreditkan saldo ───────────────────────────────────

export async function verifikasiAkhirDanKreditSaldo(
  setorSampahId: string,
  beratAktual: number,
  poinPerKg: number,
  catatan?: string,
) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  const setor = await prisma.setorSampah.findUnique({
    where: { id: setorSampahId },
    include: { nasabah: true },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SAMPAH_DITERIMA") {
    throw new Error("Sampah belum dikonfirmasi diterima");
  }

  const totalPoin = Math.round(beratAktual * poinPerKg);

  await prisma.$transaction([
    prisma.setorSampah.update({
      where: { id: setorSampahId },
      data: {
        status: "SELESAI",
        beratAktual,
        poinPerKg,
        totalPoin,
        catatanAdmin: catatan ?? null,
        selesaiAt: new Date(),
      },
    }),
    prisma.nasabah.update({
      where: { id: setor.nasabahId },
      data: { poin: { increment: totalPoin } },
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: setor.nasabahId,
        jumlah: totalPoin,
        keterangan: `Setor sampah ${setor.jenisSampah} ${beratAktual} kg`,
        referensiId: setorSampahId,
      },
    }),
  ]);

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}

export async function getSetorSampahData() {
  await checkAdminAuth();
  return await prisma.setorSampah.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nasabah: {
        select: {
          id: true,
          noTelp: true,
          alamat: true,
          nik: true,
          user: {
            select: { name: true },
          },
        },
      },
      ekpedisi: {
        select: { noTelp: true, alamat: true },
      },
    },
  });
}

export async function getEkpedisiList() {
  await checkAdminAuth();
  return await prisma.ekpedisi.findMany({
    select: { id: true, noTelp: true, alamat: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHargaTerbaru(jenisSampah: string) {
  await checkAdminAuth();
  return await prisma.hargaSampah.findFirst({
    where: { jenisSampah: jenisSampah as never },
    orderBy: { bulan: "desc" },
    select: { harga: true, point: true, bulan: true },
  });
}
