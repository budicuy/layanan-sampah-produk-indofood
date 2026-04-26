import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 60 * 60 * 24, // 1 hari
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    nextCookies(), // wajib terakhir — agar server action bisa set cookie
  ],
});

export type Session = typeof auth.$Infer.Session;
