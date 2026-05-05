import { headers } from "next/headers";
import { JWT_COOKIE_NAME, type JwtPayload, verifyJwt } from "@/app/login/auth";

/**
 * Ambil session user dari JWT cookie.
 * Mengembalikan payload JWT atau null jika tidak ada / token expired.
 *
 * Digunakan di Server Components, Server Actions, dan Route Handlers.
 */
export async function getSession(): Promise<{ user: JwtPayload } | null> {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  // Parse cookie string manually (Edge + Node compatible)
  const token = parseCookie(cookieHeader, JWT_COOKIE_NAME);
  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload) return null;

  return { user: payload };
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
