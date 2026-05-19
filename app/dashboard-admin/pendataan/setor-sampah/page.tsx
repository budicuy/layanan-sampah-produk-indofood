"use client";

import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  PackageSearch,
  Phone,
  Recycle,
  Scale,
  Search,
  Tag,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StatusSetorSampah } from "@/prisma/generated/prisma/client";
import {
  getEkpedisiList,
  getHargaTerbaru,
  getSetorSampahData,
  konfirmasiSampahDiterima,
  tugaskanEkpedisi,
  verifikasiAkhirDanKreditSaldo,
  verifikasiSetorLangsungDanKreditSaldo,
  verifikasiSetorSampah,
} from "./actions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Ekpedisi {
  id: string;
  noTelp: string;
  alamat: string;
}

interface SetorSampahItem {
  id: string;
  jenisSampah: string;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  alamatPenjemputan: string;
  status: StatusSetorSampah;
  catatanAdmin: string | null;
  ekpedisiId: string | null;
  ekpedisi: { noTelp: string; alamat: string } | null;
  totalSaldo: number | null;
  createdAt: Date;
  nasabah: {
    id: string;
    noTelp: string;
    alamat: string;
    nik: string;
    user: {
      name: string;
    };
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CFG: Record<
  StatusSetorSampah,
  { label: string; cls: string; step: number }
> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    step: 1,
  },
  TERVERIFIKASI: {
    label: "Terverifikasi",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    step: 2,
  },
  DITOLAK: {
    label: "Ditolak",
    cls: "bg-red-100 text-red-700 border-red-200",
    step: -1,
  },
  DALAM_PENJEMPUTAN: {
    label: "Penjemputan",
    cls: "bg-purple-100 text-purple-700 border-purple-200",
    step: 3,
  },
  SUDAH_DISERAHKAN: {
    label: "Diserahkan",
    cls: "bg-indigo-100 text-indigo-700 border-indigo-200",
    step: 4,
  },
  SAMPAH_DITERIMA: {
    label: "Diterima",
    cls: "bg-teal-100 text-teal-700 border-teal-200",
    step: 5,
  },
  SELESAI: {
    label: "Selesai",
    cls: "bg-green-100 text-green-700 border-green-200",
    step: 6,
  },
};

// ─── Action Panels ──────────────────────────────────────────────────────────

function PanelVerifikasi({
  id,
  onActionSuccess,
}: {
  id: string;
  onActionSuccess: () => void;
}) {
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handle(approve: boolean) {
    setLoading(approve ? "approve" : "reject");
    try {
      await verifikasiSetorSampah(id, approve, catatan || undefined);
      onActionSuccess();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional jika disetujui, wajib jika ditolak)..."
        rows={2}
        className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-zinc-400"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handle(true)}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 transition-all min-h-[48px]">
          {loading === "approve" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          Setujui
        </button>
        <button
          type="button"
          onClick={() => handle(false)}
          disabled={!!loading || !catatan.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-600 border-2 border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 active:scale-[0.98] disabled:opacity-40 transition-all min-h-[48px]">
          {loading === "reject" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <XCircle size={16} />
          )}
          Tolak
        </button>
      </div>
    </div>
  );
}

function PanelEkpedisi({
  id,
  ekpedisiList,
  onActionSuccess,
}: {
  id: string;
  ekpedisiList: Ekpedisi[];
  onActionSuccess: () => void;
}) {
  const [selectedEkpedisi, setSelectedEkpedisi] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!selectedEkpedisi) return;
    setLoading(true);
    try {
      await tugaskanEkpedisi(id, selectedEkpedisi);
      onActionSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedEkpedisi}
        onChange={(e) => setSelectedEkpedisi(e.target.value)}
        className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]">
        <option value="">-- Pilih Kurir --</option>
        {ekpedisiList.map((e) => (
          <option key={e.id} value={e.id}>
            {e.alamat} · {e.noTelp}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handle}
        disabled={loading || !selectedEkpedisi}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 transition-all min-h-[48px]">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Truck size={16} />
        )}
        {loading ? "Menugaskan..." : "Tugaskan Kurir"}
      </button>
    </div>
  );
}

function PanelTerimaSampah({
  id,
  onActionSuccess,
}: {
  id: string;
  onActionSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await konfirmasiSampahDiterima(id);
      onActionSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60 transition-all min-h-[48px]">
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <PackageCheck size={16} />
      )}
      {loading ? "Memproses..." : "Konfirmasi Sampah Diterima"}
    </button>
  );
}

function PanelVerifikasiAkhir({
  id,
  onActionSuccess,
}: {
  id: string;
  onActionSuccess: () => void;
}) {
  const [beratAktual, setBeratAktual] = useState("");
  const [hargaPerKg, setHargaPerKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview =
    beratAktual && hargaPerKg
      ? formatRupiah(Number(beratAktual) * Number(hargaPerKg))
      : null;

  async function handle() {
    if (!beratAktual || !hargaPerKg) return;
    setLoading(true);
    setError(null);
    try {
      await verifikasiAkhirDanKreditSaldo(
        id,
        Number(beratAktual),
        Number(hargaPerKg),
      );
      onActionSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-red-600 text-xs bg-red-50 p-3 rounded-xl">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`berat-${id}`}
            className="block text-xs text-zinc-500 mb-1.5 font-medium">
            Berat Aktual (kg)
          </label>
          <input
            id={`berat-${id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={beratAktual}
            onChange={(e) => setBeratAktual(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]"
          />
        </div>
        <div>
          <label
            htmlFor={`harga-${id}`}
            className="block text-xs text-zinc-500 mb-1.5 font-medium">
            Harga/kg (Rp)
          </label>
          <input
            id={`harga-${id}`}
            type="number"
            min="1"
            value={hargaPerKg}
            onChange={(e) => setHargaPerKg(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]"
          />
        </div>
      </div>
      {preview && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 p-3 rounded-xl">
          <Wallet size={16} className="text-green-600 shrink-0" />
          <p className="text-sm font-bold text-green-700">
            Total Saldo: {preview}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={handle}
        disabled={loading || !beratAktual || !hargaPerKg}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 transition-all min-h-[48px]">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        {loading ? "Memproses..." : "Selesaikan & Kreditkan Saldo"}
      </button>
    </div>
  );
}

// ─── Step Progress ──────────────────────────────────────────────────────────

const STEPS_EKSPEDISI = [
  { label: "Verifikasi", step: 1 },
  { label: "Kurir", step: 2 },
  { label: "Serah", step: 3 },
  { label: "Terima", step: 4 },
  { label: "Selesai", step: 5 },
];

const STEPS_LANGSUNG = [
  { label: "Verifikasi", step: 1 },
  { label: "Selesai", step: 6 },
];

function StepProgress({
  currentStep,
  jenisSetor,
}: {
  currentStep: number;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
}) {
  if (currentStep < 0) return null;

  const steps = jenisSetor === "LANGSUNG" ? STEPS_LANGSUNG : STEPS_EKSPEDISI;
  const totalSteps = steps.length;

  // Normalize: untuk LANGSUNG step 6 = selesai, untuk EKSPEDISI step 1-6
  const normalizedIndex =
    jenisSetor === "LANGSUNG" ? (currentStep >= 6 ? 2 : 1) : currentStep - 1;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = normalizedIndex > i;
          const active = normalizedIndex === i;
          return (
            <div key={s.label} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  done
                    ? "bg-green-400"
                    : active
                      ? jenisSetor === "LANGSUNG"
                        ? "bg-zinc-500"
                        : "bg-primary/60"
                      : "bg-zinc-200"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-0.5">
        {steps.map((s, i) => {
          const done = normalizedIndex > i;
          const active = normalizedIndex === i;
          return (
            <span
              key={s.label}
              className={`text-[9px] font-bold transition-colors ${
                done
                  ? "text-green-500"
                  : active
                    ? "text-zinc-700"
                    : "text-zinc-300"
              }`}
              style={{
                width: `${100 / totalSteps}%`,
                textAlign:
                  i === 0
                    ? "left"
                    : i === steps.length - 1
                      ? "right"
                      : "center",
              }}>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-zinc-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs text-zinc-700 mt-0.5 wrap-break-word leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-3">
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Panel Verifikasi Setor Langsung (approve = selesai + kredit saldo) ───────

function PanelVerifikasiLangsung({
  id,
  jenisSampah,
  beratEstimasi,
  onActionSuccess,
}: {
  id: string;
  jenisSampah: string;
  beratEstimasi: number;
  onActionSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingHarga, setLoadingHarga] = useState(true);
  const [hargaDB, setHargaDB] = useState<{ harga: number; bulan: Date } | null>(
    null,
  );
  const [form, setForm] = useState({
    beratAktual: "",
    hargaPerKg: "",
    catatan: "",
  });

  // Auto-load harga terbaru dari DB saat panel dibuka
  useEffect(() => {
    getHargaTerbaru(jenisSampah).then((res) => {
      if (res) {
        setHargaDB(res as { harga: number; bulan: Date });
        setForm((f) => ({ ...f, hargaPerKg: String(res.harga) }));
      }
      setLoadingHarga(false);
    });
  }, [jenisSampah]);

  // Tombol "Data Sudah Benar" — pakai berat estimasi + harga DB
  function handleDataSudahBenar() {
    setForm((f) => ({
      ...f,
      beratAktual: String(beratEstimasi),
      hargaPerKg: hargaDB ? String(hargaDB.harga) : f.hargaPerKg,
    }));
  }

  async function handleApprove() {
    if (!form.beratAktual || !form.hargaPerKg) {
      alert("Isi berat aktual dan harga per kg terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      await verifikasiSetorLangsungDanKreditSaldo(
        id,
        Number(form.beratAktual),
        Number(form.hargaPerKg),
        form.catatan || undefined,
      );
      onActionSuccess();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleTolak() {
    const catatan = prompt("Masukkan alasan penolakan:");
    if (!catatan) return;
    setLoading(true);
    try {
      await verifikasiSetorSampah(id, false, catatan);
      onActionSuccess();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Info harga dari DB */}
      {loadingHarga ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg">
          <Loader2 size={12} className="animate-spin text-zinc-400" />
          <span className="text-xs text-zinc-400">
            Memuat harga referensi...
          </span>
        </div>
      ) : hargaDB ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                Harga Referensi DB
              </p>
              <p className="text-xs font-bold text-blue-800">
                {formatRupiah(hargaDB.harga)}/kg · Bulan{" "}
                {new Date(hargaDB.bulan).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {/* Tombol Data Sudah Benar */}
          <button
            type="button"
            onClick={handleDataSudahBenar}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-60 transition-colors">
            <CheckCircle2 size={13} />
            Data Sudah Benar (Berat: {beratEstimasi} kg · Harga:{" "}
            {formatRupiah(hargaDB.harga)}/kg)
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            ⚠ Belum ada data harga referensi untuk jenis sampah ini. Input
            manual di bawah.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="pvl-beratAktual"
          className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">
          Berat Aktual (kg) *
        </label>
        <input
          id="pvl-beratAktual"
          type="number"
          min="0.1"
          step="0.1"
          value={form.beratAktual}
          onChange={(e) => setForm({ ...form, beratAktual: e.target.value })}
          placeholder="0.0"
          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>
      {form.beratAktual && form.hargaPerKg && (
        <div className="px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg space-y-0.5">
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
            Perhitungan Saldo
          </p>
          <p className="text-xs text-green-700">
            {form.beratAktual} kg × {formatRupiah(Number(form.hargaPerKg))}/kg
            {" = "}
            <span className="font-black text-green-800">
              {formatRupiah(
                Math.round(Number(form.beratAktual) * Number(form.hargaPerKg)),
              )}
            </span>
          </p>
        </div>
      )}
      <input
        type="text"
        value={form.catatan}
        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
        placeholder="Catatan (opsional)"
        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-60 transition-colors">
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          Verifikasi & Kreditkan Saldo
        </button>
        <button
          type="button"
          onClick={handleTolak}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-60 transition-colors">
          <XCircle size={12} />
          Tolak
        </button>
      </div>
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────────

function SetorCard({
  item,
  ekpedisiList,
  onActionSuccess,
}: {
  item: SetorSampahItem;
  ekpedisiList: Ekpedisi[];
  onActionSuccess: () => void;
}) {
  const cfg = STATUS_CFG[item.status] ?? {
    label: item.status,
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
    step: 0,
  };

  const needsAction = [
    "MENUNGGU_VERIFIKASI",
    "TERVERIFIKASI",
    "SUDAH_DISERAHKAN",
    "SAMPAH_DITERIMA",
  ].includes(item.status);

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col ${
        needsAction ? "border-amber-200 shadow-sm" : "border-zinc-100"
      }`}>
      {/* Header */}
      <div className="p-4 md:p-5 flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
          {item.nasabah.user?.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-zinc-900 text-sm truncate">
              {item.nasabah.user?.name}
            </p>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls} whitespace-nowrap`}>
              {cfg.label}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                item.jenisSetor === "LANGSUNG"
                  ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
              {item.jenisSetor === "LANGSUNG" ? "🏪 Langsung" : "🚚 Ekspedisi"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Tag size={11} className="text-zinc-400" />
              {item.jenisSampah === "PLASTIK"
                ? "Plastik"
                : item.jenisSampah === "KARTON"
                  ? "Karton"
                  : "Paper Cup"}
            </span>
            <span className="flex items-center gap-1">
              <Scale size={11} className="text-zinc-400" />
              {item.beratEstimasi} kg
              {item.beratAktual != null && (
                <span className="text-zinc-900 font-bold">
                  → {item.beratAktual} kg
                </span>
              )}
            </span>
          </div>
          <StepProgress currentStep={cfg.step} jenisSetor={item.jenisSetor} />
        </div>
      </div>

      {/* Detail info — always visible */}
      <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3 border-t border-zinc-100 pt-3 flex-1">
        <div className="grid grid-cols-1 gap-2.5 text-xs">
          <InfoRow icon={User} label="NIK" value={item.nasabah.nik} />
          <InfoRow icon={Phone} label="Telp" value={item.nasabah.noTelp} />
          <InfoRow
            icon={MapPin}
            label="Alamat Jemput"
            value={item.alamatPenjemputan}
          />
          {item.keterangan && (
            <InfoRow icon={Tag} label="Keterangan" value={item.keterangan} />
          )}
          {item.catatanAdmin && (
            <InfoRow
              icon={CheckCircle}
              label="Catatan Admin"
              value={item.catatanAdmin}
            />
          )}
          {item.ekpedisi && (
            <InfoRow
              icon={Truck}
              label="Kurir"
              value={`${item.ekpedisi.alamat} · ${item.ekpedisi.noTelp}`}
            />
          )}
        </div>

        {item.totalSaldo != null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
            <Wallet size={16} className="text-green-600 shrink-0" />
            <span className="text-sm font-bold text-green-700">
              Saldo Dikreditkan: {formatRupiah(item.totalSaldo)}
            </span>
          </div>
        )}

        <p className="text-[11px] text-zinc-400">
          {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </p>

        {/* Action panels */}
        {item.status === "MENUNGGU_VERIFIKASI" &&
          item.jenisSetor === "LANGSUNG" && (
            <ActionSection title="Verifikasi & Kreditkan Saldo (Setor Langsung)">
              <PanelVerifikasiLangsung
                id={item.id}
                jenisSampah={item.jenisSampah}
                beratEstimasi={item.beratEstimasi}
                onActionSuccess={onActionSuccess}
              />
            </ActionSection>
          )}
        {item.status === "MENUNGGU_VERIFIKASI" &&
          item.jenisSetor !== "LANGSUNG" && (
            <ActionSection title="Verifikasi Data">
              <PanelVerifikasi id={item.id} onActionSuccess={onActionSuccess} />
            </ActionSection>
          )}
        {item.status === "TERVERIFIKASI" && (
          <ActionSection title="Tugaskan Kurir">
            <PanelEkpedisi
              id={item.id}
              ekpedisiList={ekpedisiList}
              onActionSuccess={onActionSuccess}
            />
          </ActionSection>
        )}
        {item.status === "SUDAH_DISERAHKAN" && (
          <ActionSection title="Konfirmasi Penerimaan">
            <PanelTerimaSampah id={item.id} onActionSuccess={onActionSuccess} />
          </ActionSection>
        )}
        {item.status === "SAMPAH_DITERIMA" && (
          <ActionSection title="Verifikasi Akhir & Kreditkan Saldo">
            <PanelVerifikasiAkhir
              id={item.id}
              onActionSuccess={onActionSuccess}
            />
          </ActionSection>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS: { value: StatusSetorSampah | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "MENUNGGU_VERIFIKASI", label: "Menunggu" },
  { value: "TERVERIFIKASI", label: "Terverifikasi" },
  { value: "DALAM_PENJEMPUTAN", label: "Penjemputan" },
  { value: "SUDAH_DISERAHKAN", label: "Diserahkan" },
  { value: "SAMPAH_DITERIMA", label: "Diterima" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK", label: "Ditolak" },
];

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function SetorSampahAdminPage() {
  const [data, setData] = useState<SetorSampahItem[]>([]);
  const [ekpedisiList, setEkpedisiList] = useState<Ekpedisi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState<StatusSetorSampah | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const [resSetor, resEkpedisi] = await Promise.all([
      getSetorSampahData(),
      getEkpedisiList(),
    ]);
    setData(resSetor as unknown as SetorSampahItem[]);
    setEkpedisiList(resEkpedisi as unknown as Ekpedisi[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const menunggu = data.filter(
    (s) => s.status === "MENUNGGU_VERIFIKASI",
  ).length;
  const proses = data.filter((s) =>
    [
      "TERVERIFIKASI",
      "DALAM_PENJEMPUTAN",
      "SUDAH_DISERAHKAN",
      "SAMPAH_DITERIMA",
    ].includes(s.status),
  ).length;
  const selesai = data.filter((s) => s.status === "SELESAI").length;
  const ditolak = data.filter((s) => s.status === "DITOLAK").length;

  const stats = [
    {
      icon: Clock,
      label: "Menunggu",
      value: menunggu,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      iconBg: "bg-amber-100",
      urgent: menunggu > 0,
    },
    {
      icon: Recycle,
      label: "Dalam Proses",
      value: proses,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      iconBg: "bg-blue-100",
      urgent: false,
    },
    {
      icon: CheckCircle2,
      label: "Selesai",
      value: selesai,
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      iconBg: "bg-green-100",
      urgent: false,
    },
    {
      icon: AlertTriangle,
      label: "Ditolak",
      value: ditolak,
      color: "text-red-600",
      bg: "bg-red-50 border-red-100",
      iconBg: "bg-red-100",
      urgent: false,
    },
  ];

  const filtered = useMemo(() => {
    let result =
      filter === "ALL" ? data : data.filter((d) => d.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.nasabah.user.name.toLowerCase().includes(q) ||
          d.nasabah.nik.includes(q) ||
          d.nasabah.noTelp.includes(q),
      );
    }
    return result;
  }, [data, filter, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900 flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PackageSearch className="text-primary w-5 h-5 md:w-6 md:h-6" />
          </div>
          Setor Sampah
        </h1>
        <p className="text-zinc-500 mt-1 text-sm md:text-base ml-[52px] md:ml-[60px]">
          Kelola dan verifikasi pengajuan setor sampah dari konsumen.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 md:p-5 ${s.bg} relative overflow-hidden transition-all hover:shadow-md`}>
            {s.urgent && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
            <div
              className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p
              className={`text-2xl md:text-3xl font-heading font-bold ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIK, atau no. telp nasabah..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-zinc-400 min-h-[48px]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === "ALL"
                ? data.length
                : data.filter((d) => d.status === f.value).length;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
                  filter === f.value
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                }`}>
                {f.label}
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    filter === f.value
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-3xl border border-zinc-100">
            <PackageCheck size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium text-sm">Tidak ada data setoran</p>
            {search && (
              <p className="text-xs mt-1">
                Coba ubah kata kunci pencarian Anda
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <SetorCard
                key={item.id}
                item={item}
                ekpedisiList={ekpedisiList}
                onActionSuccess={fetchData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
