"use client";

import { signUp } from "@/lib/auth-client";
import { ArrowLeft, AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await signUp.email({
        name,
        username,
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Gagal mendaftar. Silakan coba lagi.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

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
              className="object-contain"
            />
          </div>
          <span className="font-heading text-2xl font-bold tracking-tighter text-white uppercase">
            BANK <span className="text-primary">SAMPAH</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
            Bergabunglah <br />
            <span className="text-primary">Bersama Kami</span> Hari Ini.
          </h2>
          <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
            Daftarkan akun Anda dan mulai berkontribusi untuk lingkungan yang
            lebih baik.
          </p>
        </div>

        <div className="relative z-10 text-zinc-500 text-sm">
          © {new Date().getFullYear()} BANK SAMPAH.
        </div>
      </div>

      {/* Right Side: Register Form */}
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
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-zinc-900 mb-2">
            Buat Akun Baru
          </h1>
          <p className="text-zinc-500 mb-10">
            Daftar untuk mulai mengelola sampah bersama BANK SAMPAH.
          </p>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="name"
              >
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="reg-username"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="Pilih username Anda"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="reg-email"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  id="reg-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="nama@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-bold text-zinc-700 mb-2"
                htmlFor="reg-password"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  id="reg-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-zinc-900"
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-accent transition-all shadow-xl shadow-primary/20 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-zinc-600">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:text-accent"
            >
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
