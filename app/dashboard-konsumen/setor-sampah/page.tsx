"use client";

import {
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Info,
  Loader2,
  PackageCheck,
  Recycle,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
  JenisSampah,
  StatusSetorSampah,
} from "@/prisma/generated/prisma/client";
import {
  getSetorSampahKonsumenData,
  konfirmasiSerahTerima,
  submitSetorLangsung,
  submitSetorSampah,
} from "./actions";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STEPS: {
  key: StatusSetorSampah;
  label: string;
  desc: string;
}[] = [
  {
    key: "MENUNGGU_VERIFIKASI",
    label: "Menunggu Verifikasi",
    desc: "Admin sedang meninjau data setoran Anda",
  },
  {
    key: "TERVERIFIKASI",
    label: "Terverifikasi",
    desc: "Data valid, menunggu penjemputan",
  },
  {
    key: "DALAM_PENJEMPUTAN",
    label: "Dalam Penjemputan",
    desc: "Kurir sedang dalam perjalanan ke lokasi Anda",
  },
  {
    key: "SUDAH_DISERAHKAN",
    label: "Sudah Diserahkan",
    desc: "Sampah telah diserahkan kepada kurir",
  },
  {
    key: "SAMPAH_DITERIMA",
    label: "Sampah Diterima",
    desc: "Sampah telah tiba di pusat pengolahan",
  },
  {
    key: "SELESAI",
    label: "Selesai",
    desc: "Poin telah dikreditkan ke akun Anda",
  },
];

function getStepIndex(status: StatusSetorSampah): number {
  if (status === "DITOLAK") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function StatusBadge({ status }: { status: StatusSetorSampah }) {
  const map: Record<StatusSetorSampah, { label: string; cls: string }> = {
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
    SELESAI: { label: "Selesai ✓", cls: "bg-green-100 text-green-700" },
  };

  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

function BtnKonfirmasiSerahTerima({
  setorSampahId,
  onSuccess,
}: {
  setorSampahId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKonfirmasi() {
    if (
      !confirm(
        "Apakah Anda sudah menyerahkan sampah kepada kurir? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      await konfirmasiSerahTerima(setorSampahId);
      setDone(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
        <CheckCircle size={16} />
        Sudah diserahkan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="button"
        onClick={handleKonfirmasi}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-60 transition-all active:scale-95">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <PackageCheck size={14} />
        )}
        {loading ? "Memproses..." : "Konfirmasi Sudah Diserahkan"}
      </button>
    </div>
  );
}

function FormSetorSampah({
  defaultAlamat,
  onSuccess,
}: {
  defaultAlamat?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    jenisSampah: "PLASTIK" as JenisSampah,
    beratEstimasi: "",
    keterangan: "",
    alamatPenjemputan: defaultAlamat ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitSetorSampah({
        jenisSampah: form.jenisSampah,
        beratEstimasi: Number(form.beratEstimasi),
        keterangan: form.keterangan || undefined,
        alamatPenjemputan: form.alamatPenjemputan,
      });
      setSuccess(true);
      setForm({
        jenisSampah: "PLASTIK",
        beratEstimasi: "",
        keterangan: "",
        alamatPenjemputan: defaultAlamat ?? "",
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[24px] p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Recycle className="text-green-600 w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-green-800">
          Pengajuan Berhasil!
        </h3>
        <p className="text-green-700 text-sm">
          Data setor sampah Anda sudah dikirim. Tunggu verifikasi dari admin.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">
          Ajukan Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Jenis Sampah */}
      <div>
        <label
          htmlFor="jenisSampah"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Jenis Sampah <span className="text-red-500">*</span>
        </label>
        <select
          id="jenisSampah"
          value={form.jenisSampah}
          onChange={(e) =>
            setForm({ ...form, jenisSampah: e.target.value as JenisSampah })
          }
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required>
          <option value="PLASTIK">Plastik</option>
          <option value="KARTON">Karton / Kardus</option>
          <option value="PAPER_CUP">Paper Cup</option>
        </select>
      </div>

      {/* Berat Estimasi */}
      <div>
        <label
          htmlFor="beratEstimasi"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Estimasi Berat (kg) <span className="text-red-500">*</span>
        </label>
        <input
          id="beratEstimasi"
          type="number"
          min="0.1"
          step="0.1"
          value={form.beratEstimasi}
          onChange={(e) => setForm({ ...form, beratEstimasi: e.target.value })}
          placeholder="Contoh: 2.5"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required
        />
      </div>

      {/* Alamat Penjemputan */}
      <div>
        <label
          htmlFor="alamatPenjemputan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Alamat Penjemputan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="alamatPenjemputan"
          value={form.alamatPenjemputan}
          onChange={(e) =>
            setForm({ ...form, alamatPenjemputan: e.target.value })
          }
          placeholder="Masukkan alamat lengkap untuk penjemputan..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          required
        />
      </div>

      {/* Keterangan */}
      <div>
        <label
          htmlFor="keterangan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Keterangan Tambahan{" "}
          <span className="text-zinc-400 font-normal">(opsional)</span>
        </label>
        <textarea
          id="keterangan"
          value={form.keterangan}
          onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          placeholder="Catatan tambahan untuk petugas..."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {loading ? "Mengirim..." : "Ajukan Setor Sampah"}
      </button>
    </form>
  );
}

// ─── FormSetorLangsung ───────────────────────────────────────────────────────

function FormSetorLangsung({
  onBack,
  onSuccess,
  nasabah,
  riwayat = [],
}: {
  onBack: () => void;
  onSuccess: () => void;
  nasabah: { poin: number } | null;
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button + Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-2 group mb-4 px-3 py-1.5 rounded-lg hover:bg-zinc-100 w-fit">
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>{" "}
          Kembali ke Pilihan Metode
        </button>
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
                  Poin Tabungan Anda
                </p>
                <p className="text-3xl font-heading font-bold mt-1">
                  {nasabah.poin} Poin
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
                  t: "Poin Masuk",
                  d: "Poin dikreditkan setelah proses selesai",
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
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="flex-1 px-4 py-2.5 border border-green-200 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors">
                  Ajukan Lagi
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">
                  Kembali ke Menu
                </button>
              </div>
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
                    {item.totalPoin != null && (
                      <span className="text-xs font-bold text-green-600">
                        +{item.totalPoin} poin
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

type Ekpedisi = {
  noTelp: string;
  alamat: string;
};

type SetorSampah = {
  id: string;
  jenisSampah: JenisSampah;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: StatusSetorSampah;
  catatanAdmin: string | null;
  ekpedisi: Ekpedisi | null;
  totalPoin: number | null;
  createdAt: Date;
};

type Nasabah = {
  id: string;
  alamat: string;
  poin: number;
  setorSampah: SetorSampah[];
};

export default function SetorSampahPage() {
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"MENU" | "EKSPEDISI" | "LANGSUNG">("MENU");

  const fetchData = useCallback(async () => {
    try {
      const { nasabah } = await getSetorSampahKonsumenData();
      setNasabah(nasabah as unknown as Nasabah);
    } catch (_e) {
      // Ignored or handle unauth
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

  if (view === "MENU") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-10 px-4 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Pilih Langkah Hijau Anda
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 tracking-tight leading-tight">
            Bagaimana Anda ingin{" "}
            <span className="text-primary">Setor Sampah?</span>
          </h1>
          <p className="text-zinc-500 mt-4 text-lg">
            Pilih metode yang paling nyaman bagi Anda untuk berkontribusi
            menjaga bumi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
          {/* Opsi Setor Langsung */}
          <button
            type="button"
            onClick={() => setView("LANGSUNG")}
            className="relative group flex flex-col h-full text-left bg-white border-2 border-zinc-100 p-10 rounded-[40px] transition-all hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-100 hover:-translate-y-2 overflow-hidden">
            <div className="mb-8 relative">
              <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                <Recycle className="text-zinc-400 w-10 h-10 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-4 bg-zinc-100/50 rounded-[40px] blur-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4 group-hover:text-zinc-700 transition-colors">
                Setor Langsung ke Pusat
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Datang langsung ke titik drop-off kami. Cocok untuk Anda yang
                ingin menyetor tanpa menunggu jadwal penjemputan.
              </p>

              <div className="space-y-3">
                {[
                  "Tanpa Biaya Penjemputan",
                  "Proses Lebih Cepat",
                  "Tidak Perlu Jadwal",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 text-zinc-600 group-hover:text-zinc-900 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-zinc-400" />
                    </div>
                    <span className="text-xs font-bold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-50 flex items-center justify-between relative z-10">
              <span className="text-sm font-black text-zinc-600 group-hover:translate-x-2 transition-transform duration-300 uppercase tracking-wider">
                Input Data Sampah →
              </span>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-zinc-100/50 rounded-full blur-3xl group-hover:bg-zinc-200/50 transition-all duration-700" />
          </button>

          {/* Opsi Setor Via Ekspedisi - Creative Active State */}
          <button
            type="button"
            onClick={() => setView("EKSPEDISI")}
            className="relative group flex flex-col h-full text-left bg-white border-2 border-zinc-100 p-10 rounded-[40px] transition-all hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(239,68,68,0.1)] hover:-translate-y-2 overflow-hidden">
            {/* Top Badge */}
            <div className="absolute top-6 right-6">
              <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-widest uppercase">
                Paling Praktis
              </div>
            </div>

            <div className="mb-8 relative">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                <Send className="text-primary w-10 h-10 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-4 bg-primary/10 rounded-[40px] blur-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-bold text-zinc-900 mb-4 group-hover:text-primary transition-colors">
                Layanan Jemput Ekspedisi
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6 group-hover:text-zinc-600 transition-colors">
                Duduk santai di rumah, kurir profesional kami yang akan datang
                mengambil sampah ke depan pintu Anda.
              </p>

              <div className="space-y-3">
                {[
                  "Jadwal Penjemputan Fleksibel",
                  "Tracking Kurir Real-time",
                  "Hemat Waktu & Tenaga",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 text-zinc-600 group-hover:text-zinc-900 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-xs font-bold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-50 flex items-center justify-between relative z-10">
              <span className="text-sm font-black text-primary group-hover:translate-x-2 transition-transform duration-300 uppercase tracking-wider">
                Mulai Ajukan Sekarang →
              </span>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          </button>
        </div>
      </div>
    );
  }

  if (view === "LANGSUNG") {
    const riwayatLangsung =
      nasabah?.setorSampah.filter((s) => s.jenisSetor === "LANGSUNG") ?? [];
    return (
      <FormSetorLangsung
        onBack={() => setView("MENU")}
        onSuccess={fetchData}
        nasabah={nasabah}
        riwayat={riwayatLangsung}
      />
    );
  }

  const riwayat = nasabah?.setorSampah ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setView("MENU")}
            className="text-xs font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group mb-4 px-3 py-1.5 rounded-lg hover:bg-zinc-100 w-fit">
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            Kembali ke Pilihan Metode
          </button>
          <h1 className="text-3xl font-heading font-black text-zinc-900 tracking-tight">
            Layanan <span className="text-primary">Jemput Ekspedisi</span>
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            Atur jadwal penjemputan sampah Anda dengan mudah.
          </p>
        </div>
      </div>

      {/* Saldo Banner */}
      {nasabah && (
        <div className="bg-primary rounded-[28px] p-6 text-white flex items-center justify-between shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium">
              Poin Tabungan Anda
            </p>
            <p className="text-3xl font-heading font-bold mt-1">
              {nasabah.poin} Poin
            </p>
          </div>
          <Wallet size={40} className="text-white/20 relative z-10" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
      )}

      {!nasabah && (
        <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-6 flex items-start gap-4">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-amber-800">Profil Nasabah Belum Ada</p>
            <p className="text-sm text-amber-700 mt-1">
              Akun Anda belum terhubung ke profil nasabah. Silakan hubungi admin
              untuk mendaftarkan profil nasabah Anda terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Setor */}
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-zinc-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Recycle className="text-primary" size={20} />
            </div>
            Ajukan Setoran Baru
          </h2>
          {nasabah ? (
            <FormSetorSampah
              defaultAlamat={nasabah.alamat}
              onSuccess={fetchData}
            />
          ) : (
            <p className="text-zinc-400 text-sm">
              Profil nasabah diperlukan untuk mengajukan setoran.
            </p>
          )}
        </div>

        {/* Cara Setor */}
        <div className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-xl">
          <h3 className="text-xl font-bold font-heading mb-6">Alur Proses</h3>
          <div className="space-y-5">
            {[
              {
                n: "1",
                t: "Isi & Submit",
                d: "Isi form setoran dan klik ajukan",
              },
              {
                n: "2",
                t: "Verifikasi Admin",
                d: "Admin memvalidasi data setoran",
              },
              {
                n: "3",
                t: "Penjemputan",
                d: "Kurir dijadwalkan ke alamat Anda",
              },
              {
                n: "4",
                t: "Serah Terima",
                d: "Konfirmasi setelah menyerahkan ke kurir",
              },
              {
                n: "5",
                t: "Verifikasi & Poin",
                d: "Poin masuk setelah sampah diterima",
              },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{s.t}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riwayat Setoran */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h2 className="text-xl font-heading font-bold text-zinc-900 mb-6">
            Riwayat Setoran
          </h2>
          <div className="space-y-6">
            {riwayat.map((item) => {
              const stepIdx = getStepIndex(item.status);
              const isDitolak = item.status === "DITOLAK";
              const isSelesai = item.status === "SELESAI";

              return (
                <div
                  key={item.id}
                  className="border border-zinc-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                  {/* Header kartu */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">
                        {item.jenisSampah === "PLASTIK"
                          ? "Plastik"
                          : item.jenisSampah === "KARTON"
                            ? "Karton"
                            : "Paper Cup"}{" "}
                        · {item.beratEstimasi} kg (estimasi)
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Catatan admin jika ditolak */}
                  {isDitolak && item.catatanAdmin && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <XCircle
                        size={16}
                        className="text-red-500 shrink-0 mt-0.5"
                      />
                      <p className="text-red-700 text-xs">
                        <strong>Alasan:</strong> {item.catatanAdmin}
                      </p>
                    </div>
                  )}

                  {isSelesai && item.totalPoin != null && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <Wallet size={16} className="text-green-600 shrink-0" />
                      <p className="text-green-700 text-sm font-bold">
                        +{item.totalPoin} poin dikreditkan ke poin Anda
                      </p>
                    </div>
                  )}

                  {/* Progress tracker */}
                  {!isDitolak && (
                    <div className="pt-2">
                      <div className="flex items-start gap-0">
                        {STATUS_STEPS.map((step, idx) => {
                          const done = stepIdx >= idx;
                          const current = stepIdx === idx;
                          const isLast = idx === STATUS_STEPS.length - 1;

                          return (
                            <div
                              key={step.key}
                              className="flex-1 flex flex-col items-center gap-1">
                              <div className="flex items-center w-full">
                                {/* Line kiri */}
                                <div
                                  className={`flex-1 h-0.5 ${idx === 0 ? "invisible" : done ? "bg-primary" : "bg-zinc-200"}`}
                                />
                                {/* Dot */}
                                {done ? (
                                  <CheckCircle2
                                    size={20}
                                    className={`shrink-0 ${current && !isSelesai ? "text-amber-500 animate-pulse" : "text-primary"}`}
                                  />
                                ) : (
                                  <Circle
                                    size={20}
                                    className="shrink-0 text-zinc-300"
                                  />
                                )}
                                {/* Line kanan */}
                                <div
                                  className={`flex-1 h-0.5 ${isLast ? "invisible" : done && stepIdx > idx ? "bg-primary" : "bg-zinc-200"}`}
                                />
                              </div>
                              <p
                                className={`text-[9px] text-center leading-tight px-0.5 font-medium ${done ? "text-zinc-700" : "text-zinc-400"}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ekpedisi info */}
                  {item.ekpedisi && (
                    <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-600 space-y-1">
                      <p className="font-bold text-zinc-700">Info Kurir</p>
                      <p>No. Telp: {item.ekpedisi.noTelp}</p>
                      <p>Alamat: {item.ekpedisi.alamat}</p>
                    </div>
                  )}

                  {/* Tombol konfirmasi serah terima */}
                  {item.status === "DALAM_PENJEMPUTAN" && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl mb-3">
                        <Clock size={14} className="shrink-0" />
                        Kurir sedang dalam perjalanan ke lokasi Anda. Tekan
                        tombol di bawah setelah sampah diserahkan.
                      </div>
                      <BtnKonfirmasiSerahTerima
                        setorSampahId={item.id}
                        onSuccess={fetchData}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
