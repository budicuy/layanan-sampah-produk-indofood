"use client";

import {
  ArrowLeft,
  Leaf,
  LoaderCircle,
  Lock,
  TriangleAlert,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, {});

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/hero.png"
            alt="Hero Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-16 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold mb-6 border border-white/20">
            <Leaf className="w-4 h-4 text-primary" />
            Platform Terpercaya
          </div>
          <h1 className="text-4xl lg:text-5xl font-heading font-extrabold text-white leading-tight mb-4">
            Kelola Sampah, <br />
            <span className="text-primary">Lindungi Bumi</span>
          </h1>
          <p className="text-zinc-300 text-lg max-w-md">
            Masuk ke akun Anda untuk mulai berkontribusi dalam menjaga
            kelestarian lingkungan bersama Bank Sampah.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-8 left-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-16 h-16 relative mb-6">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-2">
              Selamat Datang Kembali
            </h2>
            <p className="text-zinc-500">
              Silakan masukkan kredensial Anda untuk melanjutkan.
            </p>
          </div>

          <form action={action} className="space-y-6 mt-8">
            {state.error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                <TriangleAlert className="w-4 h-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-semibold text-zinc-900"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isPending}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm shadow-sm disabled:opacity-60"
                    placeholder="username Anda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-zinc-900"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm shadow-sm disabled:opacity-60"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
