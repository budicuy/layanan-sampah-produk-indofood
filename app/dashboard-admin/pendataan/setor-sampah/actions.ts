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

  const adminName = session.user.name || session.user.username || "Admin";

  await prisma.setorSampah.update({
    where: { id: setorSampahId },
    data: {
      status: approve ? "TERVERIFIKASI" : "DITOLAK",
      catatanAdmin: catatan ?? null,
      verifiedBy: adminName,
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
  isAutoFill?: boolean,
) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN")
    throw new Error("Unauthorized");

  const setor = await prisma.setorSampah.findUnique({
    where: { id: setorSampahId },
    include: { nasabah: { include: { user: true } } },
  });
  if (!setor) throw new Error("Data tidak ditemukan");
  if (setor.status !== "MENUNGGU_VERIFIKASI") {
    throw new Error("Status harus MENUNGGU_VERIFIKASI");
  }

  const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
  const totalValue = Math.round(beratAktual * poinPerKg);
  const now = new Date();
  const adminName = session.user.name || session.user.username || "Admin";

  // Tentukan label verifikasi
  const isAiValid = setor.statusValidasi === "VALID";
  const verifiedByLabel = isAiValid
    ? "Sistem (AI)"
    : isAutoFill
      ? `Otomatis oleh ${adminName}`
      : `Manual oleh ${adminName}`;

  const setorUpdateData = {
    status: "SELESAI" as const,
    beratAktual,
    catatanAdmin: catatan ?? null,
    verifiedBy: verifiedByLabel,
    verifikasiAt: now,
    selesaiAt: now,
    hargaPerKg: isBankSampah ? poinPerKg : undefined,
    totalHarga: isBankSampah ? totalValue : undefined,
    poinPerKg: isBankSampah ? undefined : poinPerKg,
    totalPoin: isBankSampah ? undefined : totalValue,
  };

  const nasabahUpdateData = isBankSampah
    ? { saldo: { increment: totalValue } }
    : { poin: { increment: totalValue } };

  await prisma.$transaction([
    prisma.setorSampah.update({
      where: { id: setorSampahId },
      data: setorUpdateData,
    }),
    prisma.nasabah.update({
      where: { id: setor.nasabahId },
      data: nasabahUpdateData,
    }),
    prisma.mutasiSaldo.create({
      data: {
        nasabahId: setor.nasabahId,
        jumlah: totalValue,
        keterangan: isBankSampah
          ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg`
          : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg`,
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

// ─── Verifikasi akhir & kreditkan saldo ─────────────────────────────

export async function verifikasiAkhirDanKreditSaldo(
  setorSampahId: string,
  beratAktual: number,
  poinPerKg: number,
  catatan?: string,
  isAutoFill?: boolean,
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
  const adminName = session.user.name || session.user.username || "Admin";

  // Tentukan label verifikasi
  const isAiValid = setor.statusValidasi === "VALID";
  const verifiedByLabel = isAiValid
    ? "Sistem (AI)"
    : isAutoFill
      ? `Otomatis oleh ${adminName}`
      : `Manual oleh ${adminName}`;

  await prisma.$transaction([
    prisma.setorSampah.update({
      where: { id: setorSampahId },
      data: {
        status: "SELESAI",
        beratAktual,
        poinPerKg,
        totalPoin,
        catatanAdmin: catatan ?? null,
        verifiedBy: verifiedByLabel,
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
            select: { name: true, role: true },
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

export async function batchVerifikasiSetor(ids: string[]) {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized");
  }

  const adminName = session.user.name || session.user.username || "Admin";

  const setoranList = await prisma.setorSampah.findMany({
    where: {
      id: { in: ids },
      status: "MENUNGGU_VERIFIKASI",
    },
    include: {
      nasabah: {
        include: { user: true },
      },
    },
  });

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const setor of setoranList) {
      if (setor.jenisSetor === "LANGSUNG") {
        const hargaDB = await tx.hargaSampah.findFirst({
          where: { jenisSampah: setor.jenisSampah },
          orderBy: { bulan: "desc" },
        });

        const isBankSampah = setor.nasabah.user.role === "BANK_SAMPAH";
        const ratePerKg = hargaDB
          ? isBankSampah
            ? hargaDB.harga
            : hargaDB.point
          : 0;
        const beratAktual = setor.beratTerbaca ?? setor.beratEstimasi;
        const totalValue = Math.round(beratAktual * ratePerKg);

        // Cek apakah AI sudah memvalidasi berat
        const isAiValid = setor.statusValidasi === "VALID";
        const batchVerifiedBy = isAiValid
          ? "Sistem (AI)"
          : `Otomatis oleh ${adminName}`;

        const setorUpdateData = {
          status: "SELESAI" as const,
          beratAktual,
          catatanAdmin: null,
          verifiedBy: batchVerifiedBy,
          verifikasiAt: now,
          selesaiAt: now,
          hargaPerKg: isBankSampah ? ratePerKg : undefined,
          totalHarga: isBankSampah ? totalValue : undefined,
          poinPerKg: isBankSampah ? undefined : ratePerKg,
          totalPoin: isBankSampah ? undefined : totalValue,
        };

        const nasabahUpdateData = isBankSampah
          ? { saldo: { increment: totalValue } }
          : { poin: { increment: totalValue } };

        await tx.setorSampah.update({
          where: { id: setor.id },
          data: setorUpdateData,
        });

        await tx.nasabah.update({
          where: { id: setor.nasabahId },
          data: nasabahUpdateData,
        });

        await tx.mutasiSaldo.create({
          data: {
            nasabahId: setor.nasabahId,
            jumlah: totalValue,
            keterangan: isBankSampah
              ? `Setor langsung (Cash) ${setor.jenisSampah} ${beratAktual} kg (Batch)`
              : `Setor langsung ${setor.jenisSampah} ${beratAktual} kg (Batch)`,
            referensiId: setor.id,
          },
        });
      } else {
        // Ekspedisi batch: tetap tentukan berdasarkan AI
        const isAiValid = setor.statusValidasi === "VALID";
        const batchVerifiedBy = isAiValid
          ? "Sistem (AI)"
          : `Otomatis oleh ${adminName}`;

        await tx.setorSampah.update({
          where: { id: setor.id },
          data: {
            status: "TERVERIFIKASI",
            catatanAdmin: null,
            verifiedBy: batchVerifiedBy,
            verifikasiAt: now,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard-admin/pendataan/setor-sampah");
}
