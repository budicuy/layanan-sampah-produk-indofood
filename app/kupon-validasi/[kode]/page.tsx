"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Coins,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { claimCoupon, getCouponDetails } from "./actions";

interface CouponDetails {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  poinCost: number;
  status: "AKTIF" | "DIGUNAKAN" | "EXPIRED";
  createdAt: Date;
  updatedAt: Date;
  digunakanAt: Date | null;
  nasabah: {
    id: string;
    alamat: string;
    noTelp: string;
    nik: string;
    user: {
      name: string;
      username: string;
    };
  };
}

interface PageProps {
  params: Promise<{ kode: string }>;
}

export default function KuponValidasiPage({ params }: PageProps) {
  // Resolve params using React.use()
  const resolvedParams = use(params);
  const code = resolvedParams.kode;

  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCouponDetails(code);
      setCoupon(data as unknown as CouponDetails | null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail kupon");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleUseCoupon = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menandai kupon ini sebagai TELAH DIGUNAKAN? Tindakan ini tidak dapat dibatalkan.",
      )
    ) {
      return;
    }
    setUpdating(true);
    try {
      const result = await claimCoupon(code);
      if (result.success) {
        toast.success("Kupon berhasil ditandai sebagai telah digunakan!");
        await loadDetails();
      } else {
        toast.error(result.error || "Gagal memperbarui kupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setUpdating(false);
    }
  };

  // Mask Name helper (privacy protection for public validation page)
  const maskName = (name: string) => {
    if (!name) return "";
    const words = name.split(" ");
    return words
      .map((w) => {
        if (w.length <= 2) return w;
        return w[0] + "*".repeat(w.length - 2) + w[w.length - 1];
      })
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] bg-orange-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[50%] bg-red-600/10 rounded-full blur-[120px]" />

      {/* Navigation Header */}
      <header className="relative z-10 p-6 max-w-4xl mx-auto w-full flex items-center justify-between border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 relative">
            <Image
              src="/logo.png"
              alt="Logo SICUAN"
              fill
              sizes="36px"
              className="object-contain"
            />
          </div>
          <span className="font-heading text-base font-black tracking-tight bg-linear-to-r from-red-500 to-amber-500 bg-clip-text text-transparent uppercase">
            SICUAN VALIDATOR
          </span>
        </Link>
        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          VERIFIKASI RESMI
        </span>
      </header>

      {/* Main Validation Card Area */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-6 w-full max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-20 text-zinc-500 space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="text-sm font-bold">
              Memverifikasi keaslian kode kupon...
            </p>
          </div>
        ) : !coupon ? (
          /* STATE 1: KUPON TIDAK VALID (PALSU) */
          <div className="bg-zinc-900/60 border border-red-500/30 rounded-[32px] p-8 w-full text-center space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Warning glow top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-2">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-heading text-red-500">
                KUPON TIDAK VALID!
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Kode kupon{" "}
                <span className="font-mono text-zinc-200 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  {code}
                </span>{" "}
                tidak terdaftar di sistem basis data kami.
              </p>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-900 text-left">
              <span className="text-[10px] font-bold text-red-400 block uppercase tracking-wider mb-1">
                Peringatan Keamanan
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Hindari penukaran barang dari kupon yang tidak valid atau palsu.
                Pastikan kode kupon didapatkan langsung dari aplikasi resmi
                SICUAN.
              </p>
            </div>

            <Link
              href="/"
              className="w-full block py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-2xl transition-all">
              Kembali ke Beranda
            </Link>
          </div>
        ) : coupon.status === "AKTIF" ? (
          /* STATE 2: KUPON ASLI & AKTIF (HIJAU/GOLD) */
          <div className="bg-zinc-900/60 border border-green-500/30 rounded-[32px] p-6 md:p-8 w-full space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 via-emerald-400 to-green-600" />

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black font-heading text-green-400 tracking-tight">
                KUPON ASLI & AKTIF
              </h2>
              <p className="text-xs text-zinc-400">
                Kupon ini valid dan siap untuk ditukarkan.
              </p>
            </div>

            {/* Ticket representation */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden space-y-4">
              {/* Ticket cuts */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 border-r border-zinc-800/80 rounded-full -ml-2" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-900 border-l border-zinc-800/80 rounded-full -mr-2" />

              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                  Nama Reward
                </span>
                <span className="text-base font-black text-white block mt-0.5">
                  {coupon.nama}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Nama Pemilik
                  </span>
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    {maskName(coupon.nasabah?.user?.name)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Biaya Poin
                  </span>
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mt-0.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    {coupon.poinCost} Poin
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Kode Unik
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400 block mt-0.5">
                    {coupon.kode}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Tanggal Tukar
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(coupon.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Redeem Action for Merchant */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={updating}
                onClick={handleUseCoupon}
                className="w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/10 active:scale-[0.98] transition-all">
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Telah Digunakan (Merchant)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STATE 3: KUPON SUDAH DIGUNAKAN (ABU-ABU/KUNING AMBER) */
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-[32px] p-6 md:p-8 w-full space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-600" />

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 text-zinc-400 mb-2">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black font-heading text-zinc-400 tracking-tight">
                KUPON SUDAH DIGUNAKAN
              </h2>
              <p className="text-xs text-zinc-500">
                Kupon ini valid tetapi sudah tidak berlaku lagi.
              </p>
            </div>

            {/* Ticket details */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">
                  Nama Reward
                </span>
                <span className="text-base font-black text-zinc-400 block mt-0.5">
                  {coupon.nama}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">
                    Pemilik
                  </span>
                  <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-700" />
                    {maskName(coupon.nasabah?.user?.name)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">
                    Status
                  </span>
                  <span className="inline-block text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full mt-0.5">
                    {coupon.status}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-900 space-y-2">
                <div>
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block">
                    Waktu Penggunaan (Scan)
                  </span>
                  <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {coupon.digunakanAt
                      ? new Date(coupon.digunakanAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          },
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-900 text-center">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Kupon ini tidak dapat digunakan untuk kedua kalinya. Silakan
                hubungi SICUAN jika terjadi kesalahan penukaran.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-[10px] text-zinc-600 border-t border-zinc-900">
        © 2026 SICUAN. Hak Cipta Dilindungi. Sistem Validasi Kupon Cerdas
        Anorganik.
      </footer>
    </div>
  );
}
