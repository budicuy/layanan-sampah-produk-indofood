"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { auth } from "@/lib/auth";

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

  try {
    const { user } = await auth.api.signInUsername({
      body: parsed.output,
      headers: await headers(),
    });
    return {
      msg: "Login berhasil! Mengalihkan...",
      ok: true,
      role: (user as unknown as { role: string }).role,
    };
  } catch (err) {
    if (err instanceof APIError)
      return { msg: "Username atau kata sandi salah." };
    throw err;
  }
}

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
