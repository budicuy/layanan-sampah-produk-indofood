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
    desc: "Saldo telah dikreditkan ke akun Anda",
  },
];

function getStepIndex(status: StatusSetorSampah): number {
  if (status === "DITOLAK") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
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

// ─── Main Page ───────────────────────────────────────────────────────────────

type Ekpedisi = {
  noTelp: string;
  alamat: string;
};

type SetorSampah = {
  id: string;
  jenisSampah: JenisSampah;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: StatusSetorSampah;
  catatanAdmin: string | null;
  ekpedisi: Ekpedisi | null;
  totalSaldo: number | null;
  createdAt: Date;
};

type Nasabah = {
  id: string;
  alamat: string;
  saldo: number;
  setorSampah: SetorSampah[];
};

export default function SetorSampahPage() {
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const riwayat = nasabah?.setorSampah ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-zinc-900">
          Setor Sampah
        </h1>
        <p className="text-zinc-500 mt-1">
          Ajukan setoran sampah Anda dan pantau progresnya secara real-time.
        </p>
      </div>

      {/* Saldo Banner */}
      {nasabah && (
        <div className="bg-primary rounded-[28px] p-6 text-white flex items-center justify-between shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium">
              Saldo Tabungan Anda
            </p>
            <p className="text-3xl font-heading font-bold mt-1">
              {formatRupiah(nasabah.saldo)}
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
                t: "Verifikasi & Saldo",
                d: "Saldo masuk setelah sampah diterima",
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

                  {/* Info saldo jika selesai */}
                  {isSelesai && item.totalSaldo != null && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <Wallet size={16} className="text-green-600 shrink-0" />
                      <p className="text-green-700 text-sm font-bold">
                        +{formatRupiah(item.totalSaldo)} dikreditkan ke saldo
                        Anda
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
