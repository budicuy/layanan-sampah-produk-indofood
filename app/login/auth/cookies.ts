import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "@/app/login/auth";

const isProduction = process.env.NODE_ENV !== "development";

export const AUTH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  sameSite: isProduction ? "strict" : "lax",
  secure: isProduction,
  path: "/",
  // 7 hari dalam detik
  maxAge: 60 * 60 * 24 * 7,
};

/**
 * Set the JWT auth cookie (Server Action / Route Handler context).
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(JWT_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Get the JWT token string from cookies (Server Action / Route Handler context).
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_COOKIE_NAME)?.value;
}

/**
 * Delete the JWT auth cookie (Server Action / Route Handler context).
 */
export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}
