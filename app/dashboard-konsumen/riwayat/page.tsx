"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  History,
  Package,
  Recycle,
  Scale,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getSetorSampahHistory } from "./actions";

interface SetorSampahItem {
  id: string;
  nasabahId: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  alamatPenjemputan: string;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
  status: string;
  catatanAdmin: string | null;
  verifiedBy: string | null;
  ekpedisiId: string | null;
  ekpedisi: {
    nama: string;
    noTelp: string;
    alamat: string;
  } | null;
  poinPerKg: number | null;
  totalPoin: number | null;
  hargaPerKg: number | null;
  totalHarga: number | null;
  selesaiAt: Date | null;
  verifikasiAt: Date | null;
  penjemputanAt: Date | null;
  diserahkanAt: Date | null;
  createdAt: Date;
}

const STATUS_MAP: Record<
  string,
  { label: string; cls: string; icon: typeof Clock }
> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
    icon: Clock,
  },
  TERVERIFIKASI: {
    label: "Terverifikasi",
    cls: "bg-sky-50 text-sky-700 border-sky-100",
    icon: CheckCircle2,
  },
  DITOLAK: {
    label: "Ditolak",
    cls: "bg-red-50 text-red-700 border-red-100",
    icon: CheckCircle2,
  },
  DALAM_PENJEMPUTAN: {
    label: "Penjemputan",
    cls: "bg-purple-50 text-purple-700 border-purple-100",
    icon: Truck,
  },
  SUDAH_DISERAHKAN: {
    label: "Diserahkan",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-100",
    icon: Recycle,
  },
  SAMPAH_DITERIMA: {
    label: "Diterima",
    cls: "bg-teal-50 text-teal-700 border-teal-100",
    icon: Package,
  },
  SELESAI: {
    label: "Selesai",
    cls: "bg-green-50 text-green-700 border-green-100",
    icon: CheckCircle2,
  },
};

function formatDate(dateInput: Date | string | null | undefined) {
  if (!dateInput) return "-";
  return new Date(dateInput).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RiwayatSetorPage() {
  const [history, setHistory] = useState<SetorSampahItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"LANGSUNG" | "EKSPEDISI">(
    "LANGSUNG",
  );

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getSetorSampahHistory();
        setHistory(data as unknown as SetorSampahItem[]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat riwayat",
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => item.jenisSetor === activeTab);
  }, [history, activeTab]);

  // Premium Top Statistics Cards
  const stats = useMemo(() => {
    const totalSetoran = history.length;
    const totalPoin = history.reduce(
      (sum, item) => sum + (item.totalPoin ?? 0),
      0,
    );
    const totalBerat = history.reduce(
      (sum, item) => sum + (item.beratAktual ?? item.beratEstimasi),
      0,
    );

    return [
      {
        label: "Total Setor",
        value: `${totalSetoran} Kali`,
        icon: Recycle,
        color: "text-primary",
        bg: "bg-green-50 border-green-100/50",
      },
      {
        label: "Poin Didapat",
        value: `${totalPoin} Poin`,
        icon: Coins,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100/50",
      },
      {
        label: "Berat Sampah",
        value: `${totalBerat.toFixed(1)} Kg`,
        icon: Scale,
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100/50",
      },
    ];
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-zinc-400 text-xs font-bold">Memuat riwayat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <History className="text-primary w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-heading font-black text-zinc-900 leading-tight">
            Riwayat Setoran
          </h1>
          <p className="text-zinc-400 text-[10px] mt-0.5">
            Lacak riwayat pengiriman sampah anorganik Anda.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-2xl border p-3 ${s.bg} flex flex-col items-center text-center`}>
              <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center mb-1.5 shrink-0">
                <Icon size={14} className={s.color} />
              </div>
              <p className={`text-xs font-black leading-none ${s.color}`}>
                {s.value}
              </p>
              <span className="text-[8px] text-zinc-450 font-bold mt-1 uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-zinc-100 border border-zinc-200/50 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("LANGSUNG")}
          className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "LANGSUNG"
              ? "bg-white text-primary shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}>
          🏪 Setor Langsung
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("EKSPEDISI")}
          className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "EKSPEDISI"
              ? "bg-white text-primary shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}>
          🚚 Setor via Ekspedisi
        </button>
      </div>

      {/* Card List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-zinc-100/80 shadow-xs">
            <Package
              size={40}
              className="mx-auto mb-3 opacity-20 text-zinc-500"
            />
            <p className="font-bold text-xs text-zinc-450">
              Belum ada riwayat setoran
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Kirimkan sampah Anda untuk mendapatkan poin reward.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const st = STATUS_MAP[item.status] ?? {
              label: item.status,
              cls: "bg-zinc-50 text-zinc-500 border-zinc-150",
              icon: Clock,
            };
            const StatusIcon = st.icon;

            let typeLabel = "Plastik";
            let typeCls = "bg-red-50 text-red-500 border-red-100/50";
            if (item.jenisSampah === "KARTON") {
              typeLabel = "Karton";
              typeCls = "bg-orange-50 text-orange-500 border-orange-100/50";
            } else if (item.jenisSampah === "PAPER_CUP") {
              typeLabel = "Paper Cup";
              typeCls = "bg-blue-50 text-blue-500 border-blue-100/50";
            }

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-100 shadow-xs p-4 flex flex-col gap-3 relative hover:shadow-md transition-shadow">
                {/* Upper Section */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeCls}`}>
                      <Recycle size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 text-xs">
                        {typeLabel}
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${st.cls}`}>
                    <StatusIcon size={9} />
                    {st.label}
                  </span>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-2.5 bg-zinc-50/50 border border-zinc-100 rounded-xl p-2.5 text-[10px] text-zinc-600">
                  <div>
                    <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[8px]">
                      Estimasi Berat
                    </span>
                    <span className="text-zinc-800 font-bold">
                      {item.beratEstimasi} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[8px]">
                      Berat Aktual
                    </span>
                    <span
                      className={`font-bold ${
                        item.beratAktual
                          ? "text-zinc-800"
                          : "text-zinc-400 italic"
                      }`}>
                      {item.beratAktual ? `${item.beratAktual} kg` : "Pending"}
                    </span>
                  </div>
                  {item.totalPoin !== null && (
                    <div className="col-span-2 border-t border-zinc-100 pt-2 flex items-center justify-between">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider text-[8px]">
                        Poin Reward didapatkan
                      </span>
                      <span className="text-green-600 font-black text-xs">
                        +{item.totalPoin} Poin
                      </span>
                    </div>
                  )}
                </div>

                {/* Courier details if EKSPEDISI */}
                {item.jenisSetor === "EKSPEDISI" && item.ekpedisi && (
                  <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between text-[9px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">
                      🚚 Kurir Penjemput
                    </span>
                    <span className="font-bold text-zinc-700">
                      {item.ekpedisi.nama} · {item.ekpedisi.noTelp}
                    </span>
                  </div>
                )}

                {/* Verified by admin */}
                {item.verifiedBy && (
                  <div className="border-t border-zinc-100 pt-2.5 flex items-center justify-between text-[9px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">
                      ✅ Diverifikasi oleh
                    </span>
                    <span className="font-bold text-emerald-700">
                      {item.verifiedBy}
                    </span>
                  </div>
                )}

                {/* Admin notes if exists */}
                {item.catatanAdmin && (
                  <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-2.5 text-[9px] text-amber-800">
                    <span className="font-black block uppercase tracking-wider text-[7px] text-amber-500 mb-0.5">
                      Catatan Admin
                    </span>
                    {item.catatanAdmin}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
