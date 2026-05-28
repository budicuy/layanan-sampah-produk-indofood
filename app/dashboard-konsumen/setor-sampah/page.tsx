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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button + Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1.5 group mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 w-fit">
          <span className="group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>{" "}
          Kembali ke Pilihan Metode
        </button>
        <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
          Setor{" "}
          <span className="text-zinc-600 font-bold">Langsung ke Pusat</span>
        </h1>
        <p className="text-zinc-500 mt-0.5 text-xs">
          Input data sampah yang akan Anda bawa langsung ke pusat SICUAN.
        </p>
      </div>

      <div className="space-y-4">
        {/* Saldo + Info */}
        <div className="space-y-4">
          {nasabah && (
            <div className="bg-zinc-950 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                  Poin Tabungan Anda
                </p>
                <p className="text-xl font-heading font-black mt-0.5">
                  {nasabah.poin} Poin
                </p>
              </div>
              <Wallet size={28} className="text-white/20 relative z-10" />
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          )}

          {/* Info panduan */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/80">
            <h3 className="font-bold text-zinc-800 text-xs mb-3 flex items-center gap-1.5">
              <Info size={14} className="text-zinc-500" />
              Panduan Setor Langsung
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
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
                <div key={s.n} className="flex gap-2.5 items-start">
                  <div className="w-5.5 h-5.5 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-[9px] shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700 text-[11px]">{s.t}</p>
                    <p className="text-zinc-400 text-[9px] mt-0.5 leading-tight">
                      {s.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center">
              <Recycle className="text-zinc-500" size={16} />
            </div>
            Data Sampah Anda
          </h2>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-green-800">
                Berhasil Diajukan!
              </h3>
              <p className="text-green-700 text-xs leading-relaxed">
                Data Anda sudah tercatat. Segera bawa sampah Anda ke pusat Bank
                Sampah.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="flex-1 px-3 py-2 border border-green-200 text-green-700 rounded-xl font-bold text-[10px] hover:bg-green-100 transition-colors">
                  Ajukan Lagi
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-xl font-bold text-[10px] hover:bg-green-700 transition-colors">
                  Kembali ke Menu
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {error}
                </div>
              )}

              {!nasabah && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={14} />
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Profil nasabah Anda belum terdaftar. Hubungi admin terlebih
                    dahulu.
                  </p>
                </div>
              )}

              {/* Jenis Sampah */}
              <div>
                <label
                  htmlFor="ls-jenisSampah"
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
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
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
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
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Berat aktual akan ditimbang oleh petugas di lokasi.
                </p>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="ls-keterangan"
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
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
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !nasabah}
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-zinc-950 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Recycle size={14} />
                )}
                {loading ? "Mengirim..." : "Daftarkan Setoran"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Riwayat Setor Langsung */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-1.5">
            <Recycle size={16} className="text-zinc-400" />
            Riwayat Setor Langsung
          </h2>
          <div className="space-y-2.5">
            {riwayat.map((item) => {
              let typeLabel = "Plastik";
              let typeCls = "bg-red-50 text-red-500";
              if (item.jenisSampah === "KARTON") {
                typeLabel = "Karton";
                typeCls = "bg-orange-50 text-orange-500";
              } else if (item.jenisSampah === "PAPER_CUP") {
                typeLabel = "Paper Cup";
                typeCls = "bg-blue-50 text-blue-500";
              }

              const statusMap: Record<
                StatusSetorSampah,
                { label: string; cls: string }
              > = {
                MENUNGGU_VERIFIKASI: {
                  label: "Menunggu",
                  cls: "bg-amber-100 text-amber-700",
                },
                TERVERIFIKASI: {
                  label: "Terverifikasi",
                  cls: "bg-blue-100 text-blue-700",
                },
                DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
                DALAM_PENJEMPUTAN: {
                  label: "Penjemputan",
                  cls: "bg-purple-100 text-purple-700",
                },
                SUDAH_DISERAHKAN: {
                  label: "Diserahkan",
                  cls: "bg-indigo-100 text-indigo-700",
                },
                SAMPAH_DITERIMA: {
                  label: "Diterima",
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
                  className="flex items-center justify-between border border-zinc-100/80 rounded-xl p-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeCls}`}>
                      <Recycle size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">
                        {typeLabel} · {item.beratEstimasi} kg
                        {item.beratAktual != null && (
                          <span className="text-zinc-600 font-bold">
                            {" "}
                            → {item.beratAktual} kg
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${cls}`}>
                      {label}
                    </span>
                    {item.totalPoin != null && (
                      <span className="text-[10px] font-bold text-green-600">
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
      <div className="py-2 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-left mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Pilih Langkah Hijau Anda
          </div>
          <h1 className="text-2xl font-heading font-black text-zinc-900 leading-tight">
            Bagaimana Anda ingin{" "}
            <span className="text-primary">Setor Sampah?</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-xs leading-relaxed">
            Pilih metode yang paling nyaman bagi Anda untuk berkontribusi
            menjaga bumi.
          </p>
        </div>

        <div className="space-y-4 w-full">
          {/* Opsi Setor Langsung */}
          <button
            type="button"
            onClick={() => setView("LANGSUNG")}
            className="relative group flex flex-col w-full text-left bg-white border-2 border-zinc-150/70 p-6 rounded-[24px] transition-all hover:border-zinc-300 hover:shadow-lg overflow-hidden cursor-pointer">
            <div className="mb-4 relative">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                <Recycle className="text-zinc-600 w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-2 bg-zinc-100/50 rounded-2xl blur-lg z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10 w-full">
              <h3 className="text-base font-black text-zinc-900 mb-1 group-hover:text-zinc-700 transition-colors">
                Setor Langsung ke Pusat
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                Datang langsung ke titik drop-off kami. Cocok untuk Anda yang
                ingin menyetor tanpa menunggu jadwal penjemputan.
              </p>

              <div className="space-y-2 mb-2">
                {[
                  "Tanpa Biaya Penjemputan",
                  "Proses Lebih Cepat",
                  "Tidak Perlu Jadwal",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-800 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={11} className="text-zinc-500" />
                    </div>
                    <span className="text-xs font-semibold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 w-full relative z-10">
              <div className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] group-hover:shadow-md">
                <span>Input Data Sampah</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-zinc-100/30 rounded-full blur-2xl group-hover:bg-zinc-200/30 transition-all duration-700" />
          </button>

          {/* Opsi Setor Via Ekspedisi - Creative Active State */}
          <button
            type="button"
            onClick={() => setView("EKSPEDISI")}
            className="relative group flex flex-col w-full text-left bg-white border-2 border-zinc-150/70 p-6 rounded-[24px] transition-all hover:border-primary/30 hover:shadow-lg overflow-hidden cursor-pointer">
            {/* Top Badge */}
            <div className="absolute top-4 right-4">
              <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black tracking-wider uppercase">
                Paling Praktis
              </div>
            </div>

            <div className="mb-4 relative">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                <Send className="text-primary w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-lg z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10 w-full">
              <h3 className="text-base font-black text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                Layanan Jemput Ekspedisi
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-4 group-hover:text-zinc-650 transition-colors">
                Duduk santai di rumah, kurir profesional kami yang akan datang
                mengambil sampah ke depan pintu Anda.
              </p>

              <div className="space-y-2 mb-2">
                {[
                  "Jadwal Penjemputan Fleksibel",
                  "Tracking Kurir Real-time",
                  "Hemat Waktu & Tenaga",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-800 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CheckCircle2 size={11} />
                    </div>
                    <span className="text-xs font-semibold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 w-full relative z-10">
              <div className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] group-hover:bg-primary/95 group-hover:shadow-md">
                <span>Mulai Ajukan Sekarang</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setView("MENU")}
            className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 w-fit">
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>{" "}
            Kembali ke Pilihan Metode
          </button>
          <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
            Layanan <span className="text-primary">Jemput Ekspedisi</span>
          </h1>
          <p className="text-zinc-500 mt-0.5 text-xs">
            Atur jadwal penjemputan sampah Anda dengan mudah.
          </p>
        </div>
      </div>

      {/* Saldo Banner */}
      {nasabah && (
        <div className="bg-primary rounded-2xl p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">
              Poin Tabungan Anda
            </p>
            <p className="text-xl font-heading font-black mt-0.5">
              {nasabah.poin} Poin
            </p>
          </div>
          <Wallet size={28} className="text-white/20 relative z-10" />
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      )}

      {!nasabah && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold text-amber-850 text-xs">
              Profil Nasabah Belum Ada
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Akun Anda belum terhubung ke profil nasabah. Silakan hubungi admin
              untuk mendaftarkan profil nasabah Anda terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Form Setor */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Recycle className="text-primary" size={16} />
            </div>
            Ajukan Setoran Baru
          </h2>
          {nasabah ? (
            <FormSetorSampah
              defaultAlamat={nasabah.alamat}
              onSuccess={fetchData}
            />
          ) : (
            <p className="text-zinc-400 text-xs">
              Profil nasabah diperlukan untuk mengajukan setoran.
            </p>
          )}
        </div>

        {/* Cara Setor */}
        <div className="bg-zinc-950 rounded-2xl p-5 text-white shadow-lg">
          <h3 className="text-xs font-bold font-heading mb-4 uppercase tracking-wider text-white/90">
            Alur Proses
          </h3>
          <div className="space-y-3.5">
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
              <div key={s.n} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-white text-xs leading-none">
                    {s.t}
                  </p>
                  <p className="text-zinc-400 text-[10px] mt-1 leading-tight">
                    {s.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riwayat Setoran */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-1.5">
            <Recycle size={16} className="text-zinc-400" />
            Riwayat Setoran
          </h2>
          <div className="space-y-4">
            {riwayat.map((item) => {
              const stepIdx = getStepIndex(item.status);
              const isDitolak = item.status === "DITOLAK";
              const isSelesai = item.status === "SELESAI";

              let typeLabel = "Plastik";
              let typeCls = "bg-red-50 text-red-500";
              if (item.jenisSampah === "KARTON") {
                typeLabel = "Karton";
                typeCls = "bg-orange-50 text-orange-500";
              } else if (item.jenisSampah === "PAPER_CUP") {
                typeLabel = "Paper Cup";
                typeCls = "bg-blue-50 text-blue-500";
              }

              return (
                <div
                  key={item.id}
                  className="border border-zinc-100 rounded-xl p-4 space-y-3 hover:shadow-xs transition-shadow">
                  {/* Header kartu */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeCls}`}>
                        <Recycle size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">
                          {typeLabel} · {item.beratEstimasi} kg
                          {item.beratAktual != null && (
                            <span className="text-zinc-600 font-bold">
                              {" "}
                              → {item.beratAktual} kg
                            </span>
                          )}
                        </p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Catatan admin jika ditolak */}
                  {isDitolak && item.catatanAdmin && (
                    <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                      <XCircle
                        size={14}
                        className="text-red-500 shrink-0 mt-0.5"
                      />
                      <p className="text-red-700 text-[10px] leading-relaxed">
                        <strong>Alasan:</strong> {item.catatanAdmin}
                      </p>
                    </div>
                  )}

                  {isSelesai && item.totalPoin != null && (
                    <div className="flex items-center gap-2.5 p-2.5 bg-green-50 border border-green-100 rounded-lg">
                      <Wallet size={14} className="text-green-600 shrink-0" />
                      <p className="text-green-700 text-xs font-bold">
                        +{item.totalPoin} poin dikreditkan ke poin Anda
                      </p>
                    </div>
                  )}

                  {/* Progress tracker */}
                  {!isDitolak && (
                    <div className="pt-1">
                      <div className="flex items-start gap-0">
                        {STATUS_STEPS.map((step, idx) => {
                          const done = stepIdx >= idx;
                          const current = stepIdx === idx;
                          const isLast = idx === STATUS_STEPS.length - 1;

                          return (
                            <div
                              key={step.key}
                              className="flex-1 flex flex-col items-center gap-0.5">
                              <div className="flex items-center w-full">
                                {/* Line kiri */}
                                <div
                                  className={`flex-1 h-0.5 ${idx === 0 ? "invisible" : done ? "bg-primary" : "bg-zinc-200"}`}
                                />
                                {/* Dot */}
                                {done ? (
                                  <CheckCircle2
                                    size={14}
                                    className={`shrink-0 ${current && !isSelesai ? "text-amber-500 animate-pulse" : "text-primary"}`}
                                  />
                                ) : (
                                  <Circle
                                    size={14}
                                    className="shrink-0 text-zinc-300"
                                  />
                                )}
                                {/* Line kanan */}
                                <div
                                  className={`flex-1 h-0.5 ${isLast ? "invisible" : done && stepIdx > idx ? "bg-primary" : "bg-zinc-200"}`}
                                />
                              </div>
                              <p
                                className={`text-[7px] text-center leading-tight px-0.5 font-bold ${done ? "text-zinc-700" : "text-zinc-400"}`}>
                                {step.label
                                  .replace("Menunggu ", "")
                                  .replace("Dalam ", "")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ekpedisi info */}
                  {item.ekpedisi && (
                    <div className="p-2.5 bg-zinc-50 rounded-xl text-[10px] text-zinc-600 space-y-0.5 border border-zinc-100">
                      <p className="font-bold text-zinc-700">Info Kurir</p>
                      <p>No. Telp: {item.ekpedisi.noTelp}</p>
                      <p>Alamat: {item.ekpedisi.alamat}</p>
                    </div>
                  )}

                  {/* Tombol konfirmasi serah terima */}
                  {item.status === "DALAM_PENJEMPUTAN" && (
                    <div className="pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 p-2.5 rounded-xl mb-2">
                        <Clock size={12} className="shrink-0" />
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
