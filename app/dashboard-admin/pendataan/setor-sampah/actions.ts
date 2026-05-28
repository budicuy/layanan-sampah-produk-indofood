"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";

const REVALIDATE = "/dashboard-admin/pendataan/setor-sampah";

async function getAdminSession() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");
  return session;
}

function adminLabel(
  session: Awaited<ReturnType<typeof getAdminSession>>,
  isAiValid: boolean,
  isAutoFill?: boolean,
) {
  const name = session.user.name || session.user.username || "Admin";
  if (isAiValid) return "Sistem (AI)";
  if (isAutoFill) return `Otomatis oleh ${name}`;
  return `Manual oleh ${name}`;
}

// ═══════════════════════════════════════════════════════════════════
// SETOR LANGSUNG
// ═══════════════════════════════════════════════════════════════════

/** Verifikasi & kreditkan poin untuk Setor Langsung (satu langkah) */
export async function verifikasiSetorLangsung(
  id: string,
  beratAktual: number,
  ratePerKg: number,
  catatan?: string,
  isAutoFill?: boolean,
) {
  const session = await getAdminSession();

  const setor = await prisma.setorLangsung.findUnique({
    where: { id },
    include: { nasabah: { include: { user: true } } },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "MENUNGGU_VERIFIKASI")
    throw new Error("Status harus MENUNGGU_VERIFIKASI");

  const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
  const totalValue = Math.round(beratAktual * ratePerKg);
  const now = new Date();
  const verifiedByLabel = adminLabel(
    session,
    setor.statusValidasi === "VALID",
    isAutoFill,
  );

  await prisma.$transaction([
    prisma.setorLangsung.update({
      where: { id },
      data: {
        status: "SELESAI",
        beratAktual,
        catatanAdmin: catatan ?? null,
        verifiedBy: verifiedByLabel,
        verifikasiAt: now,
        selesaiAt: now,
        hargaPerKg: isBankSampah ? ratePerKg : undefined,
        totalHarga: isBankSampah ? totalValue : undefined,
        poinPerKg: isBankSampah ? undefined : ratePerKg,
        totalPoin: isBankSampah ? undefined : totalValue,
      },
    }),
    prisma.nasabah.update({
      where: { id: setor.nasabahId },
      data: isBankSampah
        ? { saldo: { increment: totalValue } }
        : { poin: { increment: totalValue } },
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: setor.nasabahId,
        jumlah: totalValue,
        keterangan: isBankSampah
          ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg`
          : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg`,
        referensiId: id,
        jenisReferensi: "LANGSUNG",
      },
    }),
  ]);

  revalidatePath(REVALIDATE);
}

/** Tolak Setor Langsung */
export async function tolakSetorLangsung(id: string, catatan: string) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  await prisma.setorLangsung.update({
    where: { id },
    data: {
      status: "DITOLAK",
      catatanAdmin: catatan,
      verifiedBy: `Manual oleh ${name}`,
      verifikasiAt: new Date(),
    },
  });
  revalidatePath(REVALIDATE);
}

/** Batch verifikasi Setor Langsung — proses sekaligus semua yang di-checklist */
export async function batchVerifikasiSetorLangsung(ids: string[]) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  const now = new Date();

  const setoranList = await prisma.setorLangsung.findMany({
    where: { id: { in: ids }, status: "MENUNGGU_VERIFIKASI" },
    include: { nasabah: { include: { user: true } } },
  });

  const allPrices = await prisma.hargaSampah.findMany({
    orderBy: { bulan: "desc" },
  });
  const latestPrices: Record<string, (typeof allPrices)[0]> = {};
  for (const price of allPrices) {
    if (!latestPrices[price.jenisSampah]) {
      latestPrices[price.jenisSampah] = price;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const setor of setoranList) {
      const hargaDB = latestPrices[setor.jenisSampah];
      const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
      const ratePerKg = hargaDB
        ? isBankSampah
          ? hargaDB.harga
          : hargaDB.point
        : 0;
      const beratAktual = setor.beratTerbaca ?? setor.beratEstimasi;
      const totalValue = Math.round(beratAktual * ratePerKg);
      const isAiValid = setor.statusValidasi === "VALID";
      const verifiedByLabel = isAiValid
        ? "Sistem (AI)"
        : `Otomatis oleh ${name}`;

      await tx.setorLangsung.update({
        where: { id: setor.id },
        data: {
          status: "SELESAI",
          beratAktual,
          catatanAdmin: null,
          verifiedBy: verifiedByLabel,
          verifikasiAt: now,
          selesaiAt: now,
          hargaPerKg: isBankSampah ? ratePerKg : undefined,
          totalHarga: isBankSampah ? totalValue : undefined,
          poinPerKg: isBankSampah ? undefined : ratePerKg,
          totalPoin: isBankSampah ? undefined : totalValue,
        },
      });
      await tx.nasabah.update({
        where: { id: setor.nasabahId },
        data: isBankSampah
          ? { saldo: { increment: totalValue } }
          : { poin: { increment: totalValue } },
      });
      await tx.mutasiSaldo.create({
        data: {
          nasabahId: setor.nasabahId,
          jumlah: totalValue,
          keterangan: isBankSampah
            ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg (Batch)`
            : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg (Batch)`,
          referensiId: setor.id,
          jenisReferensi: "LANGSUNG",
        },
      });
    }
  });

  revalidatePath(REVALIDATE);
}

// ═══════════════════════════════════════════════════════════════════
// SETOR EKSPEDISI
// ═══════════════════════════════════════════════════════════════════

/** Verifikasi awal Setor Ekspedisi (approve/tolak) */
export async function verifikasiSetorEkspedisi(
  id: string,
  approve: boolean,
  catatan?: string,
) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  await prisma.setorEkspedisi.update({
    where: { id },
    data: {
      status: approve ? "TERVERIFIKASI" : "DITOLAK",
      catatanAdmin: catatan ?? null,
      verifiedBy: `Manual oleh ${name}`,
      verifikasiAt: new Date(),
    },
  });
  revalidatePath(REVALIDATE);
}

/** Tugaskan kurir ekspedisi */
export async function tugaskanEkpedisi(id: string, ekpedisiId: string) {
  await getAdminSession();
  const setor = await prisma.setorEkspedisi.findUnique({ where: { id } });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "TERVERIFIKASI")
    throw new Error("Status harus TERVERIFIKASI");
  await prisma.setorEkspedisi.update({
    where: { id },
    data: {
      ekpedisiId,
      status: "DALAM_PENJEMPUTAN",
      penjemputanAt: new Date(),
    },
  });
  revalidatePath(REVALIDATE);
}

/** Admin konfirmasi sampah sudah diterima di pusat */
export async function konfirmasiSampahDiterima(id: string) {
  await getAdminSession();
  const setor = await prisma.setorEkspedisi.findUnique({ where: { id } });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SUDAH_DISERAHKAN")
    throw new Error("Konsumen belum konfirmasi serah terima");
  await prisma.setorEkspedisi.update({
    where: { id },
    data: { status: "SAMPAH_DITERIMA", sampahDiterimaAt: new Date() },
  });
  revalidatePath(REVALIDATE);
}

/** Verifikasi akhir Setor Ekspedisi & kredit poin */
export async function verifikasiAkhirSetorEkspedisi(
  id: string,
  beratAktual: number,
  ratePerKg: number,
  catatan?: string,
  isAutoFill?: boolean,
) {
  const session = await getAdminSession();
  const setor = await prisma.setorEkspedisi.findUnique({
    where: { id },
    include: { nasabah: { include: { user: true } } },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "SAMPAH_DITERIMA")
    throw new Error("Sampah belum dikonfirmasi diterima");

  const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
  const totalValue = Math.round(beratAktual * ratePerKg);
  const verifiedByLabel = adminLabel(
    session,
    setor.statusValidasi === "VALID",
    isAutoFill,
  );
  const now = new Date();

  await prisma.$transaction([
    prisma.setorEkspedisi.update({
      where: { id },
      data: {
        status: "SELESAI",
        beratAktual,
        catatanAdmin: catatan ?? null,
        verifiedBy: verifiedByLabel,
        selesaiAt: now,
        hargaPerKg: isBankSampah ? ratePerKg : undefined,
        totalHarga: isBankSampah ? totalValue : undefined,
        poinPerKg: isBankSampah ? undefined : ratePerKg,
        totalPoin: isBankSampah ? undefined : totalValue,
      },
    }),
    prisma.nasabah.update({
      where: { id: setor.nasabahId },
      data: isBankSampah
        ? { saldo: { increment: totalValue } }
        : { poin: { increment: totalValue } },
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: setor.nasabahId,
        jumlah: totalValue,
        keterangan: isBankSampah
          ? `Setor ekspedisi (Cash) ${setor.jenisSampah} ${beratAktual} kg`
          : `Setor ekspedisi ${setor.jenisSampah} ${beratAktual} kg`,
        referensiId: id,
        jenisReferensi: "EKSPEDISI",
      },
    }),
  ]);

  revalidatePath(REVALIDATE);
}

/** Batch verifikasi awal Setor Ekspedisi */
export async function batchVerifikasiSetorEkspedisi(ids: string[]) {
  const session = await getAdminSession();
  const name = session.user.name || session.user.username || "Admin";
  const now = new Date();

  const setoranList = await prisma.setorEkspedisi.findMany({
    where: { id: { in: ids }, status: "MENUNGGU_VERIFIKASI" },
  });

  await prisma.$transaction(async (tx) => {
    for (const setor of setoranList) {
      const isAiValid = setor.statusValidasi === "VALID";
      await tx.setorEkspedisi.update({
        where: { id: setor.id },
        data: {
          status: "TERVERIFIKASI",
          catatanAdmin: null,
          verifiedBy: isAiValid ? "Sistem (AI)" : `Otomatis oleh ${name}`,
          verifikasiAt: now,
        },
      });
    }
  });

  revalidatePath(REVALIDATE);
}

// ═══════════════════════════════════════════════════════════════════
// DATA FETCHERS
// ═══════════════════════════════════════════════════════════════════

export async function getSetorLangsungData() {
  await getAdminSession();
  return prisma.setorLangsung.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nasabah: {
        select: {
          id: true,
          noTelp: true,
          alamat: true,
          nik: true,
          user: { select: { name: true, role: true } },
        },
      },
    },
  });
}

export async function getSetorEkspedisiData() {
  await getAdminSession();
  return prisma.setorEkspedisi.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nasabah: {
        select: {
          id: true,
          noTelp: true,
          alamat: true,
          nik: true,
          user: { select: { name: true, role: true } },
        },
      },
      ekpedisi: {
        select: { id: true, nama: true, noTelp: true, alamat: true },
      },
    },
  });
}

export async function getEkpedisiList() {
  await getAdminSession();
  return prisma.ekpedisi.findMany({
    select: { id: true, nama: true, noTelp: true, alamat: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHargaTerbaru(jenisSampah: string) {
  await getAdminSession();
  return prisma.hargaSampah.findFirst({
    where: { jenisSampah: jenisSampah as never },
    orderBy: { bulan: "desc" },
    select: { harga: true, point: true, bulan: true },
  });
}
