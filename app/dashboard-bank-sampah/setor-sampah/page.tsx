"use client";

import { CheckCircle, Info, Loader2, Recycle, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  JenisSampah,
  StatusSetorSampah,
} from "@/prisma/generated/prisma/client";
import { getSetorSampahBankSampahData, submitSetorLangsung } from "./actions";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ─── FormSetorLangsung ───────────────────────────────────────────────────────

interface SetorSampah {
  id: string;
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: StatusSetorSampah;
  catatanAdmin: string | null;
  totalHarga: number | null;
  createdAt: Date;
}

function FormSetorLangsung({
  onSuccess,
  nasabah,
  riwayat = [],
}: {
  onSuccess: () => void;
  nasabah: { saldo: number } | null;
  riwayat?: SetorSampah[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    jenisSampah: "PLASTIK" as JenisSampah,
    beratEstimasi: "",
    keterangan: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitSetorLangsung({
        jenisSampah: form.jenisSampah,
        beratEstimasi: Number(form.beratEstimasi),
        keterangan: form.keterangan || undefined,
      });
      setSuccess(true);
      setForm({ jenisSampah: "PLASTIK", beratEstimasi: "", keterangan: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-black text-zinc-900 tracking-tight">
          Setor <span className="text-zinc-700">Langsung ke Pusat</span>
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          Input data sampah yang akan Anda bawa langsung ke pusat SICUAN.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saldo + Info */}
        <div className="space-y-6">
          {nasabah && (
            <div className="bg-zinc-900 rounded-[28px] p-6 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/60 text-sm font-medium">
                  Saldo Rupiah Anda
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {formatRupiah(nasabah.saldo)}
                </p>
              </div>
              <Wallet size={40} className="text-white/20 relative z-10" />
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </div>
          )}

          {/* Info panduan */}
          <div className="bg-zinc-50 rounded-[24px] p-6 border border-zinc-100">
            <h3 className="font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <Info size={18} className="text-zinc-500" />
              Panduan Setor Langsung
            </h3>
            <div className="space-y-4">
              {[
                {
                  n: "1",
                  t: "Isi Formulir",
                  d: "Isi jenis sampah dan estimasi berat Anda",
                },
                {
                  n: "2",
                  t: "Datang ke Pusat",
                  d: "Bawa sampah ke titik drop-off SICUAN kami",
                },
                {
                  n: "3",
                  t: "Timbang & Verifikasi",
                  d: "Petugas akan menimbang dan memverifikasi sampah Anda",
                },
                {
                  n: "4",
                  t: "Saldo Masuk",
                  d: "Uang saldo dikreditkan setelah proses selesai",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700 text-sm">{s.t}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-zinc-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Recycle className="text-zinc-500" size={20} />
            </div>
            Data Sampah Anda
          </h2>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-[24px] p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-green-800">
                Berhasil Diajukan!
              </h3>
              <p className="text-green-700 text-sm">
                Data Anda sudah tercatat. Segera bawa sampah Anda ke pusat Bank
                Sampah.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-4 w-full px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">
                Ajukan Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {!nasabah && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-amber-700 text-sm">
                    Profil nasabah Anda belum terdaftar. Hubungi admin terlebih
                    dahulu.
                  </p>
                </div>
              )}

              {/* Jenis Sampah */}
              <div>
                <label
                  htmlFor="ls-jenisSampah"
                  className="block text-sm font-bold text-zinc-700 mb-2">
                  Jenis Sampah <span className="text-red-500">*</span>
                </label>
                <select
                  id="ls-jenisSampah"
                  value={form.jenisSampah}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jenisSampah: e.target.value as JenisSampah,
                    })
                  }
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all"
                  required>
                  <option value="PLASTIK">Plastik</option>
                  <option value="KARTON">Karton / Kardus</option>
                  <option value="PAPER_CUP">Paper Cup</option>
                </select>
              </div>

              {/* Berat Estimasi */}
              <div>
                <label
                  htmlFor="ls-beratEstimasi"
                  className="block text-sm font-bold text-zinc-700 mb-2">
                  Estimasi Berat (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ls-beratEstimasi"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.beratEstimasi}
                  onChange={(e) =>
                    setForm({ ...form, beratEstimasi: e.target.value })
                  }
                  placeholder="Contoh: 2.5"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all"
                  required
                />
                <p className="text-xs text-zinc-400 mt-1.5">
                  Berat aktual akan ditimbang oleh petugas di lokasi.
                </p>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="ls-keterangan"
                  className="block text-sm font-bold text-zinc-700 mb-2">
                  Keterangan Tambahan{" "}
                  <span className="text-zinc-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  id="ls-keterangan"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  placeholder="Catatan tambahan untuk petugas..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !nasabah}
                className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Recycle size={16} />
                )}
                {loading ? "Mengirim..." : "Daftarkan Setoran"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Riwayat Setor Langsung */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <Recycle size={20} className="text-zinc-400" />
            Riwayat Setor Langsung
          </h2>
          <div className="space-y-4">
            {riwayat.map((item) => {
              const jenisSampahLabel =
                item.jenisSampah === "PLASTIK"
                  ? "Plastik"
                  : item.jenisSampah === "KARTON"
                    ? "Karton"
                    : "Paper Cup";

              const statusMap: Record<
                StatusSetorSampah,
                { label: string; cls: string }
              > = {
                MENUNGGU_VERIFIKASI: {
                  label: "Menunggu Verifikasi",
                  cls: "bg-amber-100 text-amber-700",
                },
                TERVERIFIKASI: {
                  label: "Terverifikasi",
                  cls: "bg-blue-100 text-blue-700",
                },
                DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
                DALAM_PENJEMPUTAN: {
                  label: "Dalam Penjemputan",
                  cls: "bg-purple-100 text-purple-700",
                },
                SUDAH_DISERAHKAN: {
                  label: "Sudah Diserahkan",
                  cls: "bg-indigo-100 text-indigo-700",
                },
                SAMPAH_DITERIMA: {
                  label: "Sampah Diterima",
                  cls: "bg-teal-100 text-teal-700",
                },
                SELESAI: {
                  label: "Selesai ✓",
                  cls: "bg-green-100 text-green-700",
                },
              };
              const { label, cls } = statusMap[item.status];

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                      <Recycle size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">
                        {jenisSampahLabel} · {item.beratEstimasi} kg (estimasi)
                        {item.beratAktual != null && (
                          <span className="text-zinc-500 font-normal">
                            {" "}
                            → {item.beratAktual} kg aktual
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
                      {label}
                    </span>
                    {item.totalHarga != null && (
                      <span className="text-xs font-bold text-green-600">
                        +{formatRupiah(item.totalHarga)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type SetorSampahData = {
  id: string;
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: StatusSetorSampah;
  catatanAdmin: string | null;
  totalHarga: number | null;
  createdAt: Date;
};

type NasabahData = {
  id: string;
  saldo: number;
  setorSampah: SetorSampahData[];
};

export default function SetorSampahPage() {
  const [nasabah, setNasabah] = useState<NasabahData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { nasabah } = await getSetorSampahBankSampahData();
      setNasabah(nasabah as unknown as NasabahData);
    } catch (_e) {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const riwayat = nasabah?.setorSampah ?? [];

  return (
    <FormSetorLangsung
      onSuccess={fetchData}
      nasabah={nasabah}
      riwayat={riwayat}
    />
  );
}
