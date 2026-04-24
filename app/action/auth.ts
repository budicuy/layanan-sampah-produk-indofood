"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type LoginState = {
  error: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  try {
    await auth.api.signInUsername({
      body: { username, password },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Username atau password salah." };
    }
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}
