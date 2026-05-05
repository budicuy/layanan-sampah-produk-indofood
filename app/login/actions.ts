"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { prisma } from "@/lib/prisma";
import { signJwt } from "./auth";
import { deleteAuthCookie, setAuthCookie } from "./auth/cookies";

type ActionState = { msg: string; ok?: boolean; role?: string };

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = v.safeParse(
    v.object({
      username: v.pipe(v.string(), v.minLength(1, "Username wajib diisi")),
      password: v.pipe(v.string(), v.minLength(1, "Kata sandi wajib diisi")),
    }),
    { username: formData.get("username"), password: formData.get("password") },
  );

  if (!parsed.success) {
    return { msg: parsed.issues[0]?.message ?? "Input tidak valid" };
  }

  const { username, password } = parsed.output;

  // Cari user beserta password-nya di tabel account
  const account = await prisma.account.findFirst({
    where: { user: { username } },
    include: { user: true },
  });

  if (!account) {
    return { msg: "Username atau kata sandi salah." };
  }

  const passwordMatch = await compare(password, account.password);
  if (!passwordMatch) {
    return { msg: "Username atau kata sandi salah." };
  }

  const { user } = account;

  if (user.status === "NONAKTIF") {
    return { msg: "Akun Anda dinonaktifkan. Hubungi administrator." };
  }

  const token = await signJwt({
    sub: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await setAuthCookie(token);

  return {
    msg: "Login berhasil! Mengalihkan...",
    ok: true,
    role: user.role,
  };
}

export async function logoutAction() {
  await deleteAuthCookie();
  redirect("/login");
}
