"use server";

import { AuthError } from "next-auth";
import * as v from "valibot";
import { signIn, signOut } from "@/lib/auth";

const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1, "Username wajib diisi")),
  password: v.pipe(v.string(), v.minLength(1, "Kata sandi wajib diisi")),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const parsed = v.safeParse(LoginSchema, raw);
  if (!parsed.success) {
    const firstError = parsed.issues[0]?.message ?? "Input tidak valid";
    return { error: firstError };
  }

  try {
    await signIn("credentials", {
      username: parsed.output.username,
      password: parsed.output.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Username atau kata sandi salah." };
    }
    // next-auth throws NEXT_REDIRECT internally on success — re-throw agar redirect berjalan
    throw err;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
