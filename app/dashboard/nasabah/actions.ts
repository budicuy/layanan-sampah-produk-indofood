"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  KategoriNasabah,
  StatusNasabah,
} from "@/prisma/generated/prisma/client";

export async function createNasabah(data: {
  nama: string;
  alamat: string;
  noTelp: string;
  kategori: KategoriNasabah;
  nik: string;
  noRek: string;
  jenisBank: string;
  titikLokasi?: string;
  status: StatusNasabah;
  // User fields
  email: string;
  username: string;
  password: string;
}) {
  const { email, username, password, ...nasabahData } = data;

  const hashed = await hashPassword(password);

  await prisma.nasabah.create({
    data: {
      ...nasabahData,
      user: {
        create: {
          name: nasabahData.nama,
          email,
          username,
          emailVerified: true,
          role: "KONSUMEN",
          accounts: {
            create: {
              id: `acc-${username}-${Date.now()}`,
              accountId: username,
              providerId: "credential",
              password: hashed,
            },
          },
        },
      },
    },
  });

  revalidatePath("/dashboard/nasabah");
}

export async function updateNasabah(
  id: string,
  data: {
    nama: string;
    alamat: string;
    noTelp: string;
    kategori: KategoriNasabah;
    nik: string;
    noRek: string;
    jenisBank: string;
    titikLokasi?: string;
    status: StatusNasabah;
    // User fields (optional on edit)
    email?: string;
    username?: string;
    password?: string;
  },
) {
  const { email, username, password, ...nasabahData } = data;

  // Update nasabah data
  const nasabah = await prisma.nasabah.update({
    where: { id },
    data: nasabahData,
    include: { user: true },
  });

  // Update linked user fields if provided
  if (nasabah.userId && (email || username)) {
    await prisma.user.update({
      where: { id: nasabah.userId },
      data: {
        name: nasabahData.nama,
        ...(email ? { email } : {}),
        ...(username ? { username } : {}),
      },
    });
  }

  // Update password if provided
  if (nasabah.userId && password && password.trim()) {
    const hashed = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: nasabah.userId, providerId: "credential" },
      data: { password: hashed },
    });
  }

  revalidatePath("/dashboard/nasabah");
}

export async function deleteNasabah(id: string) {
  // Cascade: delete user will cascade accounts/sessions via DB
  const nasabah = await prisma.nasabah.findUnique({
    where: { id },
    select: { userId: true },
  });

  await prisma.nasabah.delete({ where: { id } });

  // Also delete linked user if exists
  if (nasabah?.userId) {
    await prisma.user.delete({ where: { id: nasabah.userId } });
  }

  revalidatePath("/dashboard/nasabah");
}
