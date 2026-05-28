"use client";

import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
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
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type {
  StatusSetorEkspedisi,
  StatusSetorLangsung,
} from "@/prisma/generated/prisma/client";
import {
  batchVerifikasiSetorEkspedisi,
  batchVerifikasiSetorLangsung,
  getEkpedisiList,
  getHargaTerbaru,
  getSetorEkspedisiData,
  getSetorLangsungData,
  konfirmasiSampahDiterima,
  tolakSetorLangsung,
  tugaskanEkpedisi,
  verifikasiAkhirSetorEkspedisi,
  verifikasiSetorEkspedisi,
  verifikasiSetorLangsung,
} from "./actions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EkpedisiItem {
  id: string;
  nama: string;
  noTelp: string;
  alamat: string;
}

interface NasabahInfo {
  id: string;
  noTelp: string;
  alamat: string;
  nik: string;
  user: { name: string; role: string };
}

/** Data untuk setor langsung (drop-off) */
interface SetorLangsungItem {
  id: string;
  jenisSetor: "LANGSUNG";
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: StatusSetorLangsung;
  catatanAdmin: string | null;
  verifiedBy: string | null;
  verifikasiAt: Date | null;
  selesaiAt: Date | null;
  totalPoin: number | null;
  totalHarga: number | null;
  poinPerKg: number | null;
  hargaPerKg: number | null;
  createdAt: Date;
  gambarTimbangan: string | null;
  gambarBukti: string[];
  statusValidasi: string | null;
  beratTerbaca: number | null;
  nasabah: NasabahInfo;
}

/** Data untuk setor ekspedisi (kurir penjemput) */
interface SetorEkspedisiItem {
  id: string;
  jenisSetor: "EKSPEDISI";
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  alamatPenjemputan: string;
  status: StatusSetorEkspedisi;
  catatanAdmin: string | null;
  verifiedBy: string | null;
  verifikasiAt: Date | null;
  ekpedisiId: string | null;
  ekpedisi: { id: string; nama: string; noTelp: string; alamat: string } | null;
  penjemputanAt: Date | null;
  diserahkanAt: Date | null;
  sampahDiterimaAt: Date | null;
  selesaiAt: Date | null;
  totalPoin: number | null;
  totalHarga: number | null;
  poinPerKg: number | null;
  hargaPerKg: number | null;
  createdAt: Date;
  gambarTimbangan: string | null;
  gambarBukti: string[];
  statusValidasi: string | null;
  beratTerbaca: number | null;
  nasabah: NasabahInfo;
}

type SetorItem = SetorLangsungItem | SetorEkspedisiItem;

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

// Status config untuk Setor Langsung
const STATUS_LANGSUNG_CFG: Record<
  StatusSetorLangsung,
  { label: string; cls: string; step: number }
> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    step: 1,
  },
  DITOLAK: {
    label: "Ditolak",
    cls: "bg-red-100 text-red-700 border-red-200",
    step: -1,
  },
  SELESAI: {
    label: "Selesai",
    cls: "bg-green-100 text-green-700 border-green-200",
    step: 6,
  },
};

// Status config untuk Setor Ekspedisi
const STATUS_EKSPEDISI_CFG: Record<
  StatusSetorEkspedisi,
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

function getStatusCfg(item: SetorItem) {
  if (item.jenisSetor === "LANGSUNG")
    return STATUS_LANGSUNG_CFG[item.status as StatusSetorLangsung];
  return STATUS_EKSPEDISI_CFG[item.status as StatusSetorEkspedisi];
}

// ─── Action Panels ──────────────────────────────────────────────────────────

// Panel verifikasi awal untuk Setor Ekspedisi (approve/tolak)
function PanelVerifikasiEkspedisi({
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
      await verifikasiSetorEkspedisi(id, approve, catatan || undefined);
      toast.success(approve ? "Data disetujui" : "Data ditolak");
      onActionSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses");
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

// Panel verifikasi + kredit poin untuk Setor Langsung (satu langkah)
function _unused_PanelVerifikasiLangsung({
  id,
  statusValidasi,
  onActionSuccess,
}: {
  id: string;
  statusValidasi: string | null;
  onActionSuccess: () => void;
}) {
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [beratAktual, setBeratAktual] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [isAutoFill, setIsAutoFill] = useState(false);

  async function handleApprove() {
    const berat = Number.parseFloat(beratAktual);
    const rate = Number.parseFloat(ratePerKg);
    if (!berat || !rate) {
      toast.error("Isi berat aktual dan rate per kg");
      return;
    }
    setLoading("approve");
    try {
      await verifikasiSetorLangsung(
        id,
        berat,
        rate,
        catatan || undefined,
        isAutoFill,
      );
      toast.success("Setor langsung diverifikasi & poin dikreditkan!");
      onActionSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!catatan.trim()) {
      toast.error("Catatan wajib diisi saat menolak");
      return;
    }
    setLoading("reject");
    try {
      await tolakSetorLangsung(id, catatan);
      toast.success("Data ditolak");
      onActionSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Berat aktual (kg)"
          value={beratAktual}
          onChange={(e) => setBeratAktual(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="number"
          step="1"
          placeholder="Rate/kg (poin)"
          value={ratePerKg}
          onChange={(e) => setRatePerKg(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan admin (opsional)"
        rows={2}
        className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-zinc-400"
      />
      <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
        <input
          type="checkbox"
          checked={isAutoFill}
          onChange={(e) => setIsAutoFill(e.target.checked)}
          className="rounded"
        />
        Data diisi otomatis (gunakan label "Otomatis oleh Admin")
      </label>
      {statusValidasi === "VALID" && (
        <p className="text-xs text-green-600 font-medium">
          ✅ AI telah memvalidasi berat — akan dicatat sebagai "Sistem (AI)"
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 transition-all min-h-[48px]">
          {loading === "approve" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          Verifikasi & Kredit Poin
        </button>
        <button
          type="button"
          onClick={handleReject}
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
  ekpedisiList: EkpedisiItem[];
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
  jenisSampah,
  beratEstimasi,
  onActionSuccess,
}: {
  id: string;
  jenisSampah: string;
  beratEstimasi: number;
  onActionSuccess: () => void;
}) {
  const [beratAktual, setBeratAktual] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHarga, setLoadingHarga] = useState(true);
  const [hargaDB, setHargaDB] = useState<{
    harga: number;
    point: number;
    bulan: Date;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poinPerKg = hargaDB ? hargaDB.point : 0;

  // Auto-load harga terbaru dari DB saat panel dibuka
  useEffect(() => {
    getHargaTerbaru(jenisSampah).then((res) => {
      if (res) setHargaDB(res as { harga: number; point: number; bulan: Date });
      setLoadingHarga(false);
    });
  }, [jenisSampah]);

  // Tombol "Data Sudah Benar" — pakai berat estimasi + harga DB
  function handleDataSudahBenar() {
    setBeratAktual(String(beratEstimasi));
  }

  async function handle() {
    if (!beratAktual || !poinPerKg) return;
    setLoading(true);
    setError(null);
    try {
      await verifikasiAkhirSetorEkspedisi(
        id,
        Number(beratAktual),
        poinPerKg,
        catatan || undefined,
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
                Poin Referensi DB
              </p>
              <p className="text-xs font-bold text-blue-800">
                {hargaDB.point} poin/kg · Harga {formatRupiah(hargaDB.harga)}/kg
                · Bulan{" "}
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
            Data Sudah Benar (Berat: {beratEstimasi} kg · {hargaDB.point}{" "}
            poin/kg)
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
      {beratAktual && poinPerKg ? (
        <div className="px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg space-y-0.5">
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
            Perhitungan Poin
          </p>
          <p className="text-xs text-green-700">
            {beratAktual} kg × {poinPerKg} poin/kg
            {" = "}
            <span className="font-black text-green-800">
              {Math.round(Number(beratAktual) * poinPerKg)} poin
            </span>
          </p>
        </div>
      ) : null}
      <input
        type="text"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional)"
        className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-200 min-h-[48px]"
      />
      <button
        type="button"
        onClick={handle}
        disabled={loading || !beratAktual || !hargaDB}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 transition-all min-h-[48px]">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        {loading ? "Memproses..." : "Selesaikan & Kreditkan Poin"}
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
  role,
  onActionSuccess,
}: {
  id: string;
  jenisSampah: string;
  beratEstimasi: number;
  role: string;
  onActionSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingHarga, setLoadingHarga] = useState(true);
  const [hargaDB, setHargaDB] = useState<{
    harga: number;
    point: number;
    bulan: Date;
  } | null>(null);
  const [form, setForm] = useState({
    beratAktual: "",
    catatan: "",
  });

  const isBankSampah = role === "BANK_SAMPAH";
  const ratePerKg = hargaDB
    ? isBankSampah
      ? hargaDB.harga
      : hargaDB.point
    : 0;

  // Auto-load harga terbaru dari DB saat panel dibuka
  useEffect(() => {
    getHargaTerbaru(jenisSampah).then((res) => {
      if (res) setHargaDB(res as { harga: number; point: number; bulan: Date });
      setLoadingHarga(false);
    });
  }, [jenisSampah]);

  // Tombol "Data Sudah Benar" — pakai berat estimasi
  function handleDataSudahBenar() {
    setForm((f) => ({ ...f, beratAktual: String(beratEstimasi) }));
  }

  async function handleApprove() {
    if (!form.beratAktual || !ratePerKg) {
      toast.error(
        "Isi berat aktual terlebih dahulu dan pastikan data tarif tersedia",
      );
      return;
    }
    setLoading(true);
    try {
      await verifikasiSetorLangsung(
        id,
        Number(form.beratAktual),
        ratePerKg,
        form.catatan || undefined,
        true, // isAutoFill = true (tombol "Data Sudah Benar")
      );
      toast.success("Setor langsung diverifikasi & poin dikreditkan!");
      onActionSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleTolak() {
    const catatan = prompt("Masukkan alasan penolakan:");
    if (!catatan) return;
    setLoading(true);
    try {
      await tolakSetorLangsung(id, catatan);
      toast.success("Data ditolak");
      onActionSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
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
                Tarif Referensi DB
              </p>
              <p className="text-xs font-bold text-blue-800">
                Poin: {hargaDB.point} poin/kg · Harga:{" "}
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
            Data Sudah Benar (Berat: {beratEstimasi} kg ·{" "}
            {isBankSampah
              ? `${formatRupiah(ratePerKg)}/kg`
              : `${ratePerKg} poin/kg`}
            )
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700 font-medium">
            ⚠ Belum ada data harga referensi untuk jenis sampah ini.
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
      {form.beratAktual && ratePerKg ? (
        <div className="px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg space-y-0.5">
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
            Perhitungan {isBankSampah ? "Saldo Rupiah" : "Poin"}
          </p>
          <p className="text-xs text-green-700">
            {form.beratAktual} kg ×{" "}
            {isBankSampah
              ? `${formatRupiah(ratePerKg)}/kg`
              : `${ratePerKg} poin/kg`}
            {" = "}
            <span className="font-black text-green-800">
              {isBankSampah
                ? formatRupiah(Math.round(Number(form.beratAktual) * ratePerKg))
                : `${Math.round(Number(form.beratAktual) * ratePerKg)} poin`}
            </span>
          </p>
        </div>
      ) : null}
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
          disabled={loading || !form.beratAktual || !hargaDB}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-60 transition-colors">
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          Verifikasi & Kreditkan {isBankSampah ? "Saldo" : "Poin"}
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
  item: SetorItem;
  ekpedisiList: EkpedisiItem[];
  onActionSuccess: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState("");

  useEffect(() => {
    if (showModal && item.gambarTimbangan) {
      setActiveImageUrl(item.gambarTimbangan);
    }
  }, [showModal, item.gambarTimbangan]);

  const cfg = getStatusCfg(item) ?? {
    label: item.status,
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
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
          {item.jenisSetor === "EKSPEDISI" && (
            <InfoRow
              icon={MapPin}
              label="Alamat Jemput"
              value={item.alamatPenjemputan}
            />
          )}
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
          {item.jenisSetor === "EKSPEDISI" && item.ekpedisi && (
            <InfoRow
              icon={Truck}
              label="Kurir"
              value={`${item.ekpedisi.alamat} · ${item.ekpedisi.noTelp}`}
            />
          )}
        </div>

        {item.gambarTimbangan && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Verifikasi Gambar AI
              </span>
              {item.statusValidasi === "VALID" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                  <CheckCircle2 size={10} /> Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                  <AlertTriangle size={10} /> Perlu Review
                </span>
              )}
            </div>
            {item.beratTerbaca !== null && (
              <div className="text-xs text-zinc-650">
                <p>
                  Berat Terbaca AI:{" "}
                  <strong className="text-zinc-900">
                    {item.beratTerbaca} kg
                  </strong>
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Estimasi Konsumen: {item.beratEstimasi} kg (Selisih:{" "}
                  {Math.abs(item.beratTerbaca - item.beratEstimasi).toFixed(2)}{" "}
                  kg)
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer">
              <Eye size={13} />
              Lihat Gambar Timbangan
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-150 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-zinc-900 text-base">
                    Bukti Timbangan & Foto Sampah
                  </h3>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Detail foto timbangan yang dianalisis oleh AI beserta bukti
                    tambahan dari konsumen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-zinc-100 text-zinc-450 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer">
                  <XCircle size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* AI Validation Stats */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Status Validasi AI
                    </span>
                    <div className="mt-1">
                      {item.statusValidasi === "VALID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          ✓ Cocok (VALID)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          ⚠ Perlu Review Manual
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Selisih Berat
                    </span>
                    <p className="font-bold text-zinc-800 mt-1">
                      {item.beratTerbaca !== null
                        ? `${Math.abs(item.beratTerbaca - item.beratEstimasi).toFixed(2)} kg`
                        : "N/A (AI Gagal Membaca)"}
                    </p>
                  </div>
                  <div className="border-t border-zinc-200 pt-2 mt-2 col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">
                        Estimasi User
                      </span>
                      <p className="font-bold text-zinc-800">
                        {item.beratEstimasi} kg
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">
                        Terbaca AI
                      </span>
                      <p className="font-black text-primary">
                        {item.beratTerbaca !== null
                          ? `${item.beratTerbaca} kg`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">
                        Jenis Sampah
                      </span>
                      <p className="font-bold text-zinc-800">
                        {item.jenisSampah === "PLASTIK"
                          ? "Plastik"
                          : item.jenisSampah === "KARTON"
                            ? "Karton"
                            : "Paper Cup"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Images Gallery */}
                <div className="space-y-4">
                  {/* Active Large Image Display */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {activeImageUrl === item.gambarTimbangan
                        ? "📸 Gambar Timbangan (Analisis AI)"
                        : "📸 Foto Bukti Tambahan"}
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video flex items-center justify-center relative">
                      {activeImageUrl && typeof activeImageUrl === "string" ? (
                        <Image
                          src={activeImageUrl}
                          alt="Bukti Setoran"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs text-zinc-400">
                          Tidak ada gambar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail selectors */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Pilih Gambar
                    </span>
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {/* Scale Display Thumbnail */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageUrl(item.gambarTimbangan || "")
                        }
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-zinc-50 cursor-pointer transition-all ${
                          activeImageUrl === item.gambarTimbangan
                            ? "border-primary scale-[1.03]"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}>
                        {item.gambarTimbangan &&
                        typeof item.gambarTimbangan === "string" ? (
                          <Image
                            src={item.gambarTimbangan}
                            alt="Timbangan"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-400">
                            No Image
                          </div>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white text-center py-0.5 font-bold uppercase z-10">
                          AI Timbang
                        </span>
                      </button>

                      {item.gambarBukti?.map((url, idx) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActiveImageUrl(url)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-zinc-50 cursor-pointer transition-all ${
                            activeImageUrl === url
                              ? "border-primary scale-[1.03]"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}>
                          {url && typeof url === "string" ? (
                            <Image
                              src={url}
                              alt={`Bukti ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-400">
                              No Image
                            </div>
                          )}
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white text-center py-0.5 font-bold uppercase z-10">
                            Bukti {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-zinc-150 bg-zinc-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {item.totalPoin != null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
            <Wallet size={16} className="text-green-600 shrink-0" />
            <span className="text-sm font-bold text-green-700">
              Poin Dikreditkan: {item.totalPoin} poin
            </span>
          </div>
        )}

        {item.totalHarga != null && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
            <Wallet size={16} className="text-green-600 shrink-0" />
            <span className="text-sm font-bold text-green-700">
              Saldo Rupiah Dikreditkan: {formatRupiah(item.totalHarga)}
            </span>
          </div>
        )}

        <p className="text-[11px] text-zinc-400">
          {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </p>

        {/* Action panels */}
        {item.status === "MENUNGGU_VERIFIKASI" &&
          item.jenisSetor === "LANGSUNG" && (
            <ActionSection
              title={
                item.nasabah.user.role === "BANK_SAMPAH"
                  ? "Verifikasi & Kreditkan Saldo (Setor Langsung)"
                  : "Verifikasi & Kreditkan Poin (Setor Langsung)"
              }>
              <PanelVerifikasiLangsung
                id={item.id}
                jenisSampah={item.jenisSampah}
                beratEstimasi={item.beratEstimasi}
                role={item.nasabah.user.role}
                onActionSuccess={onActionSuccess}
              />
            </ActionSection>
          )}
        {item.status === "MENUNGGU_VERIFIKASI" &&
          item.jenisSetor !== "LANGSUNG" && (
            <ActionSection title="Verifikasi Data">
              <PanelVerifikasiEkspedisi
                id={item.id}
                onActionSuccess={onActionSuccess}
              />
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
          <ActionSection title="Verifikasi Akhir & Kreditkan Poin">
            <PanelVerifikasiAkhir
              id={item.id}
              jenisSampah={item.jenisSampah}
              beratEstimasi={item.beratEstimasi}
              onActionSuccess={onActionSuccess}
            />
          </ActionSection>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS: { value: string; label: string }[] = [
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
  const [data, setData] = useState<SetorItem[]>([]);
  const [ekpedisiList, setEkpedisiList] = useState<EkpedisiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"LANGSUNG" | "EKSPEDISI">(
    "LANGSUNG",
  );

  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const pendingItems = useMemo(() => {
    return data.filter(
      (s) => s.jenisSetor === activeTab && s.status === "MENUNGGU_VERIFIKASI",
    );
  }, [data, activeTab]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const openBatchModal = useCallback(() => {
    setShowBatchModal(true);
    setSelectedIds(pendingItems.map((item) => item.id));
  }, [pendingItems]);

  const closeBatchModal = useCallback(() => {
    setShowBatchModal(false);
    setSelectedIds([]);
    setExpandedIds([]);
  }, []);

  const fetchData = useCallback(async () => {
    const [resLangsung, resEkspedisi, resEkpedisi] = await Promise.all([
      getSetorLangsungData(),
      getSetorEkspedisiData(),
      getEkpedisiList(),
    ]);
    const langsung = (resLangsung as unknown as SetorLangsungItem[]).map(
      (s) => ({ ...s, jenisSetor: "LANGSUNG" as const }),
    );
    const ekspedisi = (resEkspedisi as unknown as SetorEkspedisiItem[]).map(
      (s) => ({ ...s, jenisSetor: "EKSPEDISI" as const }),
    );
    setData([...langsung, ...ekspedisi]);
    setEkpedisiList(resEkpedisi as unknown as EkpedisiItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBatchVerify = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      if (activeTab === "LANGSUNG") {
        await batchVerifikasiSetorLangsung(selectedIds);
      } else {
        await batchVerifikasiSetorEkspedisi(selectedIds);
      }
      toast.success(`${selectedIds.length} setoran berhasil diverifikasi!`);
      closeBatchModal();
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal melakukan batch verifikasi",
      );
    } finally {
      setBatchLoading(false);
    }
  }, [selectedIds, fetchData, closeBatchModal, activeTab]);

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

        {/* Filter tabs + Batch Verify */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide flex-1">
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

          {pendingItems.length > 0 && (
            <button
              type="button"
              onClick={openBatchModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-sm shrink-0 min-h-[40px] cursor-pointer">
              <CheckCircle size={14} />
              Verifikasi Semua ({pendingItems.length})
            </button>
          )}
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
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-zinc-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-150 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-zinc-900 text-base">
                    Batch Verifikasi Setor Sampah
                  </h3>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Tinjau dan verifikasi semua setoran yang sedang menunggu
                    persetujuan sekaligus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeBatchModal}
                  className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer">
                  <XCircle size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {pendingItems.length === 0 ? (
                  <div className="text-center py-12 text-zinc-450">
                    <PackageCheck
                      size={40}
                      className="mx-auto mb-3 opacity-30"
                    />
                    <p className="text-xs font-bold">
                      Tidak ada setoran yang menunggu verifikasi
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Select All Bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <span className="text-[11px] font-bold text-zinc-700">
                        Pilih Semua ({selectedIds.length}/{pendingItems.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedIds.length === pendingItems.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(pendingItems.map((item) => item.id));
                          }
                        }}
                        className="text-[10px] font-black text-primary hover:text-primary/95 transition-colors cursor-pointer">
                        {selectedIds.length === pendingItems.length
                          ? "BATALKAN SEMUA"
                          : "PILIH SEMUA"}
                      </button>
                    </div>

                    {/* Pending List */}
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {pendingItems.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        let typeLabel = "Plastik";
                        if (item.jenisSampah === "KARTON") typeLabel = "Karton";
                        else if (item.jenisSampah === "PAPER_CUP")
                          typeLabel = "Paper Cup";
                        const isExpanded = expandedIds.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col border rounded-xl transition-all ${
                              isSelected
                                ? "border-green-300 bg-green-50/10"
                                : "border-zinc-200 hover:bg-zinc-50/50"
                            }`}>
                            {/* Main row */}
                            <div className="flex items-center justify-between p-3">
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.id)}
                                className="flex-1 min-w-0 pr-3 cursor-pointer select-none text-left focus:outline-none">
                                <div className="flex items-center gap-1.5">
                                  {isExpanded ? (
                                    <ChevronUp
                                      size={14}
                                      className="text-zinc-400 shrink-0"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={14}
                                      className="text-zinc-400 shrink-0"
                                    />
                                  )}
                                  <p className="font-bold text-zinc-900 text-xs truncate">
                                    {item.nasabah.user.name}
                                  </p>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                      item.jenisSetor === "LANGSUNG"
                                        ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                        : "bg-blue-50 text-blue-600 border-blue-100"
                                    }`}>
                                    {item.jenisSetor === "LANGSUNG"
                                      ? "🏪 Langsung"
                                      : "🚚 Ekspedisi"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 ml-5">
                                  <span>
                                    {typeLabel} · {item.beratEstimasi} kg
                                  </span>
                                  {item.gambarTimbangan && (
                                    <span
                                      className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded font-bold text-[8px] border ${
                                        item.statusValidasi === "VALID"
                                          ? "bg-green-100 text-green-700 border-green-200"
                                          : "bg-amber-100 text-amber-700 border-amber-200"
                                      }`}>
                                      AI:{" "}
                                      {item.statusValidasi === "VALID"
                                        ? "Valid"
                                        : "Perlu Review"}{" "}
                                      (
                                      {item.beratTerbaca !== null
                                        ? `${item.beratTerbaca}kg`
                                        : "-"}
                                      )
                                    </span>
                                  )}
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedIds((prev) =>
                                    prev.includes(item.id)
                                      ? prev.filter((x) => x !== item.id)
                                      : [...prev, item.id],
                                  );
                                }}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all min-w-[80px] text-center cursor-pointer ${
                                  isSelected
                                    ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                                    : "bg-zinc-100 text-zinc-650 hover:bg-zinc-200"
                                }`}>
                                {isSelected ? "VALID ✓" : "Tandai VALID"}
                              </button>
                            </div>

                            {/* Dropdown Summary Content */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-zinc-100 bg-zinc-50/30 text-[11px] text-zinc-600 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">
                                      NIK
                                    </span>
                                    <span className="text-zinc-800 font-medium">
                                      {item.nasabah.nik || "-"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">
                                      No. Telp
                                    </span>
                                    <span className="text-zinc-800 font-medium">
                                      {item.nasabah.noTelp || "-"}
                                    </span>
                                  </div>
                                  {item.jenisSetor === "EKSPEDISI" && (
                                    <div className="sm:col-span-2">
                                      <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">
                                        Alamat Penjemputan
                                      </span>
                                      <span className="text-zinc-800 font-medium">
                                        {item.alamatPenjemputan || "-"}
                                      </span>
                                    </div>
                                  )}
                                  {item.keterangan && (
                                    <div className="sm:col-span-2">
                                      <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">
                                        Keterangan
                                      </span>
                                      <span className="text-zinc-800 font-medium">
                                        {item.keterangan}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Attachments thumbnails */}
                                {(item.gambarTimbangan ||
                                  (item.gambarBukti &&
                                    item.gambarBukti.length > 0)) && (
                                  <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                                    <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">
                                      Foto Lampiran
                                    </span>
                                    <div className="flex flex-wrap gap-2.5">
                                      {item.gambarTimbangan && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewImageUrl(
                                              item.gambarTimbangan,
                                            )
                                          }
                                          className="relative group block rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-all shrink-0 bg-white w-14 h-14 cursor-pointer focus:outline-none">
                                          <Image
                                            src={item.gambarTimbangan}
                                            alt="Timbangan"
                                            fill
                                            className="object-cover hover:scale-105 transition-transform"
                                            unoptimized
                                          />
                                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-bold uppercase z-10">
                                            Timbangan
                                          </span>
                                        </button>
                                      )}
                                      {item.gambarBukti?.map((url, idx) => (
                                        <button
                                          key={url}
                                          type="button"
                                          onClick={() =>
                                            setPreviewImageUrl(url)
                                          }
                                          className="relative group block rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-all shrink-0 bg-white w-14 h-14 cursor-pointer focus:outline-none">
                                          <Image
                                            src={url}
                                            alt={`Bukti ${idx + 1}`}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform"
                                            unoptimized
                                          />
                                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-bold uppercase z-10">
                                            Bukti {idx + 1}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-zinc-150 bg-zinc-50 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedIds.length} data terpilih untuk diverifikasi.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeBatchModal}
                    className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
                    disabled={batchLoading}>
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchVerify}
                    disabled={batchLoading || selectedIds.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm cursor-pointer">
                    {batchLoading && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    Konfirmasi Verifikasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewImageUrl && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative max-w-2xl w-full max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Preview Bukti
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-6 flex items-center justify-center bg-zinc-900 aspect-video relative">
                <Image
                  src={previewImageUrl}
                  alt="Preview Bukti"
                  fill
                  sizes="(max-w-2xl) 100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
