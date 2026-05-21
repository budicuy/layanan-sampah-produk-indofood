"use client";

import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { ajukanPencairan, getNasabahSaldo, getPencairanList } from "./actions";

type StatusPencairan = "DIAJUKAN" | "DIVERIFIKASI" | "DICAIRKAN" | "DITOLAK";

type Pencairan = {
  id: string;
  jumlah: number;
  status: StatusPencairan;
  catatan: string | null;
  catatanAdmin: string | null;
  buktiFoto: string | null;
  diajukanAt: Date;
  diverifikasi: Date | null;
  dicairkan: Date | null;
};

const STATUS_CONFIG: Record<
  StatusPencairan,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DIAJUKAN: {
    label: "Diajukan",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock size={14} />,
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <AlertCircle size={14} />,
  },
  DICAIRKAN: {
    label: "Dicairkan",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle size={14} />,
  },
  DITOLAK: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={14} />,
  },
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function PencairanBankSampahPage() {
  const [list, setList] = useState<Pencairan[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    setLoading(true);
    const [listData, saldoData] = await Promise.all([
      getPencairanList(),
      getNasabahSaldo(),
    ]);
    setList(listData as Pencairan[]);
    setSaldo(saldoData?.saldo ?? 0);
    setLoading(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = () => {
    const nominal = Number(jumlah.replace(/\D/g, ""));
    if (!nominal || nominal < 50000) {
      toast.error("Minimal pencairan Rp 50.000");
      return;
    }
    if (nominal % 50000 !== 0) {
      toast.error("Jumlah harus kelipatan Rp 50.000");
      return;
    }
    if (nominal > saldo) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    const formData = new FormData();
    formData.set("jumlah", String(nominal));
    formData.set("catatan", catatan);

    startTransition(async () => {
      try {
        await ajukanPencairan(formData);
        toast.success("Pengajuan pencairan berhasil dikirim!");
        setShowModal(false);
        setJumlah("");
        setCatatan("");
        await fetchData();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Gagal mengajukan pencairan",
        );
      }
    });
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Pencairan Dana</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Ajukan dan kelola pengajuan pencairan saldo bank sampah Anda
        </p>
      </div>

      <div className="space-y-4">
        {/* Left Column: Saldo & Info */}
        <div className="space-y-4">
          {/* Saldo Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} className="text-emerald-200" />
                <span className="text-xs text-emerald-200 font-medium">
                  Saldo Tersedia
                </span>
              </div>
              <div className="text-2xl font-black tracking-tight mb-3">
                {loading ? "—" : formatRupiah(saldo)}
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={saldo < 50000 || loading}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={14} />
                Ajukan Pencairan
              </button>
            </div>
          </div>

          {/* Ketentuan Card */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-800">
              Ketentuan Pencairan Dana
            </h3>
            <ul className="text-[10px] text-zinc-500 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  Minimal pencairan adalah{" "}
                  <strong>{formatRupiah(50000)}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  Jumlah pencairan harus kelipatan{" "}
                  <strong>{formatRupiah(50000)}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>
                  Tiap transaksi sukses akan dilampirkan bukti transfer oleh
                  admin.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Riwayat */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-zinc-800">
              Riwayat Pengajuan
            </h2>
            <button
              type="button"
              onClick={fetchData}
              className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 hover:bg-zinc-100 rounded-lg">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 bg-white rounded-xl border border-zinc-100 shadow-xs">
              <Banknote size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Belum ada pengajuan pencairan</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-zinc-100 p-4 shadow-xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm font-black text-zinc-900">
                          {formatRupiah(item.jumlah)}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Diajukan:{" "}
                          {new Date(item.diajukanAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </p>
                        {item.catatan && (
                          <p className="text-[10px] text-zinc-500 mt-1 italic">
                            "{item.catatan}"
                          </p>
                        )}
                        {item.catatanAdmin && (
                          <p className="text-[9px] text-blue-600 mt-1 bg-blue-50/50 px-2 py-0.5 rounded-lg inline-block">
                            Admin: {item.catatanAdmin}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="text-right">
                          {item.dicairkan && (
                            <p className="text-[8px] text-emerald-600 font-medium">
                              Cair:{" "}
                              {new Date(item.dicairkan).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          )}
                        </div>
                        {item.buktiFoto && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPhoto(item.buktiFoto ?? "")
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Bukti Transfer">
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajukan */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-zinc-900">
              Ajukan Pencairan Dana
            </h3>

            {/* Quick amounts */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-2">
                Pilih Nominal
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setJumlah(a.toLocaleString("id-ID"))}
                    disabled={a > saldo}
                    className={`text-xs font-semibold py-2 px-3 rounded-xl border transition-all ${
                      Number(jumlah.replace(/\D/g, "")) === a
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}>
                    {formatRupiah(a)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">
                Atau masukkan nominal custom
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-semibold">
                  Rp
                </span>
                <input
                  id="jumlah-pencairan"
                  type="text"
                  value={jumlah}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setJumlah(raw ? Number(raw).toLocaleString("id-ID") : "");
                  }}
                  placeholder="50.000"
                  className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Min. Rp 50.000, kelipatan Rp 50.000 | Saldo:{" "}
                {formatRupiah(saldo)}
              </p>
            </div>

            {/* Catatan */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">
                Catatan (opsional)
              </p>
              <textarea
                id="catatan-pencairan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                placeholder="Tambahkan catatan untuk admin..."
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {isPending ? "Mengajukan..." : "Ajukan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bukti pencairan"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedPhoto(null)}>
          <div className="max-w-lg w-full">
            <Image
              src={selectedPhoto}
              alt="Bukti pencairan"
              width={600}
              height={400}
              className="w-full rounded-2xl shadow-2xl"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="mt-4 w-full py-2 bg-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
