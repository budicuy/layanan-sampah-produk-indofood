import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

// Instance Auth.js tanpa Prisma — aman untuk Edge Runtime
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
