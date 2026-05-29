"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
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
  const accountList = await db
    .select({
      id: account.id,
      userId: account.userId,
      password: account.password,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
    .from(account)
    .innerJoin(user, eq(account.userId, user.id))
    .where(eq(user.username, username))
    .limit(1);

  const accountData = accountList[0] || null;

  if (!accountData) {
    return { msg: "Username atau kata sandi salah." };
  }

  const passwordMatch = await compare(password, accountData.password);
  if (!passwordMatch) {
    return { msg: "Username atau kata sandi salah." };
  }

  const { user: userData } = accountData;

  if (userData.status === "NONAKTIF") {
    return { msg: "Akun Anda dinonaktifkan. Hubungi administrator." };
  }

  const token = await signJwt({
    sub: userData.id,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    role: userData.role,
  });

  await setAuthCookie(token);

  return {
    msg: "Login berhasil! Mengalihkan...",
    ok: true,
    role: userData.role,
  };
}

export async function logoutAction() {
  await deleteAuthCookie();
  redirect("/login");
}
