"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, StatusUser } from "@/prisma/generated/prisma/client";

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
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
    const hashedPassword = await hashPassword("password");

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
    revalidatePath("/dashboard/users");
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
    revalidatePath("/dashboard/users");
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
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Gagal menghapus data user" };
  }
}

export async function resetPassword(id: string) {
  await checkAdminAuth();
  try {
    const hashedPassword = await hashPassword("password");

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
