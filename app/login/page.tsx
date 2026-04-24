"use client";

import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction } from "@/app/action/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side: Branding */}
      <div className="hidden md:flex md:w-1/2 bg-zinc-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-16 h-16 relative">
            <Image
              src="/logo.png"
              alt="Logo Bank Sampah"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <span className="font-heading text-2xl font-bold tracking-tighter text-white uppercase">
            BANK <span className="text-primary">SAMPAH</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
            Membangun Masa Depan <br />
            <span className="text-primary">Lebih Bersih</span> Bersama.
          </h2>
          <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
            Kelola sampah Anda dengan sistem tercanggih di Indonesia. Bersama
            kita ciptakan lingkungan yang berkelanjutan.
          </p>
        </div>

        <div className="relative z-10 text-zinc-500 text-sm">
          © {new Date().getFullYear()} BANK SAMPAH.
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-24 bg-white relative">
        <Link
          href="/"
          className="absolute top-8 left-8 md:hidden flex items-center gap-2 text-zinc-600 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 md:hidden flex justify-center">
            <div className="w-16 h-16 relative">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-zinc-900 mb-2">
            Selamat Datang Kembali
          </h1>
          <p className="text-zinc-500 mb-10">
            Masuk ke akun Anda untuk melanjutkan pengelolaan sampah.
          </p>

          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="Masukkan username Anda"
                  required
                  autoComplete="username"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="password"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="block w-full pl-12 pr-12 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-accent transition-all shadow-xl shadow-primary/20 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-label="Loading"
                    role="img"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-zinc-600">
            Belum punya akun?{" "}
            <a href="/" className="font-bold text-primary hover:text-accent">
              Hubungi Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
