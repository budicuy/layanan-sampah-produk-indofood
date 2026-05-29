"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { mutasiSaldo, nasabah, pencairan } from "@/lib/db/schema";
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

export async function getPencairanAdminList() {
  await checkAdminAuth();
  return db.query.pencairan.findMany({
    orderBy: (pencairan, { desc }) => [desc(pencairan.createdAt)],
    with: {
      nasabah: {
        with: { user: { columns: { name: true, username: true } } },
      },
    },
  });
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
