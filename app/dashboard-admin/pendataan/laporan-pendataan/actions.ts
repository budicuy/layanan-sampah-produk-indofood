"use server";

import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function getLaporanData() {
  await checkAdminAuth();

  const [setorLangsungData, setorEkspedisiData, pencairanData, kuponData] =
    await Promise.all([
      // 1a. Setor Langsung selesai
      db.query.setorLangsung.findMany({
        where: (setorLangsung, { eq }) => eq(setorLangsung.status, "SELESAI"),
        orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.selesaiAt)],
        with: {
          nasabah: {
            columns: {
              id: true,
              nik: true,
              kategori: true,
            },
            with: {
              user: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      // 1b. Setor Ekspedisi selesai
      db.query.setorEkspedisi.findMany({
        where: (setorEkspedisi, { eq }) => eq(setorEkspedisi.status, "SELESAI"),
        orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.selesaiAt)],
        with: {
          nasabah: {
            columns: {
              id: true,
              nik: true,
              kategori: true,
            },
            with: {
              user: {
                columns: {
                  name: true,
                },
              },
            },
          },
          ekpedisi: {
            columns: {
              alamat: true,
              noTelp: true,
            },
          },
        },
      }),
      // 2. Semua Pencairan
      db.query.pencairan.findMany({
        orderBy: (pencairan, { desc }) => [desc(pencairan.createdAt)],
        with: {
          nasabah: {
            columns: {
              id: true,
              nik: true,
            },
            with: {
              user: {
                columns: {
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      // 3. Semua Kupon
      db.query.kupon.findMany({
        orderBy: (kupon, { desc }) => [desc(kupon.createdAt)],
        with: {
          nasabah: {
            columns: {
              id: true,
              nik: true,
            },
            with: {
              user: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

  // Gabungkan setor langsung + ekspedisi, tandai jenisnya
  const setoran = [
    ...setorLangsungData.map((s) => ({
      ...s,
      jenisSetor: "LANGSUNG" as const,
      ekpedisi: null,
    })),
    ...setorEkspedisiData.map((s) => ({
      ...s,
      jenisSetor: "EKSPEDISI" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(b.selesaiAt ?? b.createdAt).getTime() -
      new Date(a.selesaiAt ?? a.createdAt).getTime(),
  );

  return { setoran, pencairan: pencairanData, kupon: kuponData };
}
