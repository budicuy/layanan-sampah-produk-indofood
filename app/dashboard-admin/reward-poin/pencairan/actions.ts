"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { mutasiSaldo, nasabah, pencairan, user } from "@/lib/db/schema";
import { uploadToR2 } from "@/lib/r2";

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

export async function getPencairanAdminList(params: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  filterStatus?: string;
}) {
  await checkAdminAuth();

  const { page = 1, pageSize = 10, searchTerm, filterStatus = "ALL" } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (searchTerm && searchTerm.trim() !== "") {
    const term = `%${searchTerm.trim()}%`;
    conditions.push(or(ilike(user.name, term), ilike(user.username, term)));
  }

  if (filterStatus && filterStatus !== "ALL") {
    conditions.push(
      eq(
        pencairan.status,
        filterStatus as "DIAJUKAN" | "DIVERIFIKASI" | "DICAIRKAN" | "DITOLAK",
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [statsRes] = await db
    .select({
      diajukan: sql<number>`count(case when status = 'DIAJUKAN' then 1 end)`,
      diverifikasi: sql<number>`count(case when status = 'DIVERIFIKASI' then 1 end)`,
      dicairkan: sql<number>`count(case when status = 'DICAIRKAN' then 1 end)`,
      totalNilai: sql<number>`sum(case when status = 'DICAIRKAN' then jumlah else 0 end)`,
    })
    .from(pencairan);

  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pencairan)
    .leftJoin(nasabah, eq(pencairan.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause);

  const totalFiltered = Number(countRes?.count || 0);

  const filteredIdsRows = await db
    .select({ id: pencairan.id })
    .from(pencairan)
    .leftJoin(nasabah, eq(pencairan.nasabahId, nasabah.id))
    .leftJoin(user, eq(nasabah.userId, user.id))
    .where(whereClause)
    .orderBy(desc(pencairan.createdAt))
    .limit(pageSize)
    .offset(offset);

  const filteredIds = filteredIdsRows.map((r) => r.id);

  let data: Awaited<ReturnType<typeof db.query.pencairan.findMany>> = [];
  if (filteredIds.length > 0) {
    data = await db.query.pencairan.findMany({
      where: inArray(pencairan.id, filteredIds),
      orderBy: (pencairan, { desc }) => [desc(pencairan.createdAt)],
      with: {
        nasabah: {
          with: { user: { columns: { name: true, username: true } } },
        },
      },
    });
  }

  return {
    data,
    total: totalFiltered,
    stats: {
      diajukan: Number(statsRes?.diajukan || 0),
      diverifikasi: Number(statsRes?.diverifikasi || 0),
      dicairkan: Number(statsRes?.dicairkan || 0),
      totalNilai: Number(statsRes?.totalNilai || 0),
    },
  };
}

export async function verifikasiPencairan(id: string, catatan: string) {
  await checkAdminAuth();

  await db
    .update(pencairan)
    .set({
      status: "DIVERIFIKASI",
      catatanAdmin: catatan || null,
      diverifikasi: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pencairan.id, id));

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}

export async function cairkanPencairan(formData: FormData) {
  await checkAdminAuth();

  const id = String(formData.get("id"));
  const catatanAdmin = String(formData.get("catatanAdmin") || "");
  const fotoFile = formData.get("buktiFoto") as File | null;

  const pencairanItem = await db.query.pencairan.findFirst({
    where: (pencairan, { eq }) => eq(pencairan.id, id),
    with: { nasabah: true },
  });

  if (!pencairanItem) throw new Error("Pencairan tidak ditemukan");

  if (!fotoFile || fotoFile.size === 0) {
    throw new Error("Foto bukti transfer wajib diupload sebelum mencairkan.");
  }

  if (fotoFile.size > 61440) {
    throw new Error(
      `Ukuran foto ${(fotoFile.size / 1024).toFixed(0)}KB melebihi batas. Coba gunakan gambar yang lebih kecil.`,
    );
  }
  const buffer = Buffer.from(await fotoFile.arrayBuffer());
  const buktiFotoUrl = await uploadToR2(buffer, fotoFile.type, "pencairan");

  await db.transaction(async (tx) => {
    await tx
      .update(pencairan)
      .set({
        status: "DICAIRKAN",
        catatanAdmin: catatanAdmin || null,
        buktiFoto: buktiFotoUrl,
        dicairkan: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pencairan.id, id));

    await tx
      .update(nasabah)
      .set({
        saldo: sql`saldo - ${pencairanItem.jumlah}`,
        updatedAt: new Date(),
      })
      .where(eq(nasabah.id, pencairanItem.nasabahId));

    await tx.insert(mutasiSaldo).values({
      id: crypto.randomUUID(),
      nasabahId: pencairanItem.nasabahId,
      jumlah: -pencairanItem.jumlah,
      keterangan: `Pencairan dana Rp ${pencairanItem.jumlah.toLocaleString("id-ID")}`,
      referensiId: id,
    });
  });

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}

export async function tolakPencairan(id: string, catatan: string) {
  await checkAdminAuth();

  await db
    .update(pencairan)
    .set({
      status: "DITOLAK",
      catatanAdmin: catatan || null,
      updatedAt: new Date(),
    })
    .where(eq(pencairan.id, id));

  revalidatePath("/dashboard-admin/reward-poin/pencairan");
  return { success: true };
}
