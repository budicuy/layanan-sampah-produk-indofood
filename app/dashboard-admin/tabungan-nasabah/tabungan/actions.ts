"use server";

import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getTabunganData() {
  await checkAdminAuth();
  const data = await db.query.nasabah.findMany({
    orderBy: (nasabah, { desc }) => [desc(nasabah.poin)],
    with: {
      user: {
        columns: { name: true, role: true },
      },
      setorLangsung: {
        orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
        limit: 10,
      },
      setorEkspedisi: {
        orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.createdAt)],
        limit: 10,
        with: {
          ekpedisi: {
            columns: { alamat: true, noTelp: true },
          },
        },
      },
      mutasiSaldo: {
        orderBy: (mutasiSaldo, { desc }) => [desc(mutasiSaldo.createdAt)],
        limit: 20,
      },
    },
  });

  return data.map((nasabah) => {
    const combinedSetor = [
      ...nasabah.setorLangsung.map((s) => ({
        ...s,
        jenisSetor: "LANGSUNG" as const,
        ekpedisi: null,
      })),
      ...nasabah.setorEkspedisi.map((s) => ({
        ...s,
        jenisSetor: "EKSPEDISI" as const,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      ...nasabah,
      setorSampah: combinedSetor,
    };
  });
}
