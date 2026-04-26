import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Konfigurasi Auth.js tanpa database adapter.
 * Aman dipakai di Edge Runtime (proxy.ts / middleware.ts).
 */
export default {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 hari
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Provider ini hanya placeholder untuk proxy/edge.
    // Logika authorize yang sesungguhnya ada di auth.ts (Node.js runtime).
    Credentials({}),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { username?: string }).username =
        token.username as string;
      (session.user as { role?: string }).role = token.role as string;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/dashboard")) return isLoggedIn;
      if (pathname === "/login" && isLoggedIn)
        return Response.redirect(new URL("/dashboard", request.nextUrl));

      return true;
    },
  },
} satisfies NextAuthConfig;
