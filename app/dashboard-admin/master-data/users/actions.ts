"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import type { Role, StatusUser } from "@/prisma/generated/prisma/client";

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

    await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        status: data.status,
        emailVerified: true,
        accounts: {
          create: {
            id: `acc-${Date.now()}`,
            accountId: data.username,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
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
    await prisma.user.update({
      where: { id },
      data,
    });
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
    await prisma.user.delete({
      where: { id },
    });
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

    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashedPassword },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { success: false, error: "Gagal mereset kata sandi" };
  }
}

export async function getUserData() {
  await checkAdminAuth();
  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return users;
}
