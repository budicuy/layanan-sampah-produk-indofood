"use server";

import { hash } from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import { account, type Role, type StatusUser, user } from "@/lib/db/schema";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  role: Role;
  status: StatusUser;
}) {
  await checkAdminAuth();
  try {
    const hashedPassword = await hash("password", 12);

    await db.transaction(async (tx) => {
      const userId = crypto.randomUUID();
      await tx.insert(user).values({
        id: userId,
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        status: data.status,
      });

      await tx.insert(account).values({
        id: crypto.randomUUID(),
        userId,
        password: hashedPassword,
      });
    });

    revalidatePath("/dashboard-admin/master-data/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Gagal menambahkan data user" };
  }
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    username: string;
    email: string;
    role: Role;
    status: StatusUser;
  },
) {
  await checkAdminAuth();
  try {
    await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));
    revalidatePath("/dashboard-admin/master-data/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: "Gagal memperbarui data user" };
  }
}

export async function deleteUser(id: string) {
  await checkAdminAuth();
  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/dashboard-admin/master-data/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Gagal menghapus data user" };
  }
}

export async function resetPassword(id: string) {
  await checkAdminAuth();
  try {
    const hashedPassword = await hash("password", 12);

    await db
      .update(account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(account.userId, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { success: false, error: "Gagal mereset kata sandi" };
  }
}

export async function getUserData() {
  await checkAdminAuth();
  const data = await db.select().from(user).orderBy(desc(user.updatedAt));
  return data;
}
