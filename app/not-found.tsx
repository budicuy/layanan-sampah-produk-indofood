import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-9xl font-heading font-extrabold text-zinc-900 leading-none mb-4">
        404
      </h1>
      <h2 className="text-3xl font-heading font-bold text-zinc-800 mb-6">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-10 text-lg leading-relaxed">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Mari
        kembali ke jalur yang benar.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-accent transition-all shadow-xl shadow-primary/25">
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Beranda
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-zinc-100 text-zinc-900 rounded-2xl font-bold text-lg hover:border-primary hover:text-primary transition-all shadow-sm">
          Ke Dashboard
        </Link>
      </div>

      <div className="mt-20 text-zinc-400 text-sm font-medium uppercase tracking-widest">
        BANK SAMPAH INDOFOOD
      </div>
    </div>
  );
}
