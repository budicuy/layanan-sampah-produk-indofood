"use client";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { StatusSetorSampah } from "@/prisma/generated/prisma/client";
import {
  konfirmasiSampahDiterima,
  tugaskanEkpedisi,
  verifikasiAkhirDanKreditSaldo,
  verifikasiSetorSampah,
} from "../actions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Ekpedisi {
  id: string;
  noTelp: string;
  alamat: string;
}

interface SetorSampahItem {
  id: string;
  jenisSampah: string;
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
    nama: string;
    noTelp: string;
    alamat: string;
    nik: string;
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

const STATUS_LABEL: Record<StatusSetorSampah, { label: string; cls: string }> =
  {
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
    SELESAI: { label: "Selesai", cls: "bg-green-100 text-green-700" },
  };

// ─── Sub Components ──────────────────────────────────────────────────────────

function PanelVerifikasi({ id }: { id: string }) {
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handle(approve: boolean) {
    setLoading(approve ? "approve" : "reject");
    try {
      await verifikasiSetorSampah(id, approve, catatan || undefined);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
        Verifikasi Data
      </p>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional untuk disetujui, wajib jika ditolak)..."
        rows={2}
        className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex gap-3">
        <button
          id={`btn-approve-${id}`}
          type="button"
          onClick={() => handle(true)}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-60 transition-all">
          {loading === "approve" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          Setujui
        </button>
        <button
          id={`btn-reject-${id}`}
          type="button"
          onClick={() => handle(false)}
          disabled={!!loading || !catatan.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-60 transition-all">
          {loading === "reject" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
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
}: {
  id: string;
  ekpedisiList: Ekpedisi[];
}) {
  const [selectedEkpedisi, setSelectedEkpedisi] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!selectedEkpedisi) return;
    setLoading(true);
    try {
      await tugaskanEkpedisi(id, selectedEkpedisi);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
        Tugaskan Kurir
      </p>
      <select
        id={`select-ekpedisi-${id}`}
        value={selectedEkpedisi}
        onChange={(e) => setSelectedEkpedisi(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
        <option value="">-- Pilih Kurir --</option>
        {ekpedisiList.map((e) => (
          <option key={e.id} value={e.id}>
            {e.alamat} · {e.noTelp}
          </option>
        ))}
      </select>
      <button
        id={`btn-tugaskan-${id}`}
        type="button"
        onClick={handle}
        disabled={loading || !selectedEkpedisi}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-60 transition-all">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Truck size={14} />
        )}
        {loading ? "Menugaskan..." : "Tugaskan Kurir"}
      </button>
    </div>
  );
}

function PanelTerimaSampah({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await konfirmasiSampahDiterima(id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide mb-3">
        Konfirmasi Sampah Diterima
      </p>
      <button
        id={`btn-terima-${id}`}
        type="button"
        onClick={handle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 disabled:opacity-60 transition-all">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <PackageCheck size={14} />
        )}
        {loading ? "Memproses..." : "Konfirmasi Sampah Diterima"}
      </button>
    </div>
  );
}

function PanelVerifikasiAkhir({ id }: { id: string }) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
        Verifikasi Akhir & Kreditkan Saldo
      </p>
      {error && (
        <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`input-berat-${id}`}
            className="block text-xs text-zinc-500 mb-1 font-medium">
            Berat Aktual (kg)
          </label>
          <input
            id={`input-berat-${id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={beratAktual}
            onChange={(e) => setBeratAktual(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label
            htmlFor={`input-harga-${id}`}
            className="block text-xs text-zinc-500 mb-1 font-medium">
            Harga/kg (Rp)
          </label>
          <input
            id={`input-harga-${id}`}
            type="number"
            min="1"
            value={hargaPerKg}
            onChange={(e) => setHargaPerKg(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
      {preview && (
        <p className="text-sm font-bold text-green-700 bg-green-50 p-3 rounded-xl text-center">
          Total Saldo: {preview}
        </p>
      )}
      <button
        id={`btn-kreditkan-${id}`}
        type="button"
        onClick={handle}
        disabled={loading || !beratAktual || !hargaPerKg}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-60 transition-all">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <CheckCircle size={14} />
        )}
        {loading ? "Memproses..." : "Selesaikan & Kreditkan Saldo"}
      </button>
    </div>
  );
}

// ─── Main Card ───────────────────────────────────────────────────────────────

function SetorCard({
  item,
  ekpedisiList,
}: {
  item: SetorSampahItem;
  ekpedisiList: Ekpedisi[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { label, cls } = STATUS_LABEL[item.status] ?? {
    label: item.status,
    cls: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-bold text-zinc-900 text-sm">
              {item.nasabah.nama}
            </p>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            NIK: {item.nasabah.nik} · Telp: {item.nasabah.noTelp}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {item.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"} ·{" "}
            {item.beratEstimasi} kg estimasi
            {item.beratAktual != null ? ` · ${item.beratAktual} kg aktual` : ""}
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
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors"
          aria-label="Toggle detail">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3 text-sm border-t border-zinc-100 pt-4">
          <p className="text-zinc-600">
            <strong>Alamat Penjemputan:</strong> {item.alamatPenjemputan}
          </p>
          {item.keterangan && (
            <p className="text-zinc-600">
              <strong>Keterangan:</strong> {item.keterangan}
            </p>
          )}
          {item.catatanAdmin && (
            <p className="text-zinc-600">
              <strong>Catatan Admin:</strong> {item.catatanAdmin}
            </p>
          )}
          {item.ekpedisi && (
            <p className="text-zinc-600">
              <strong>Kurir:</strong> {item.ekpedisi.alamat} ·{" "}
              {item.ekpedisi.noTelp}
            </p>
          )}
          {item.totalSaldo != null && (
            <p className="text-green-700 font-bold">
              Saldo Dikreditkan: {formatRupiah(item.totalSaldo)}
            </p>
          )}

          {/* Action panels */}
          {item.status === "MENUNGGU_VERIFIKASI" && (
            <PanelVerifikasi id={item.id} />
          )}
          {item.status === "TERVERIFIKASI" && (
            <PanelEkpedisi id={item.id} ekpedisiList={ekpedisiList} />
          )}
          {item.status === "SUDAH_DISERAHKAN" && (
            <PanelTerimaSampah id={item.id} />
          )}
          {item.status === "SAMPAH_DITERIMA" && (
            <PanelVerifikasiAkhir id={item.id} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main List Component ─────────────────────────────────────────────────────

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

export default function SetorSampahAdminList({
  data,
  ekpedisiList,
}: {
  data: SetorSampahItem[];
  ekpedisiList: Ekpedisi[];
}) {
  const [filter, setFilter] = useState<StatusSetorSampah | "ALL">("ALL");

  const filtered =
    filter === "ALL" ? data : data.filter((d) => d.status === filter);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            id={`filter-${f.value}`}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.value
                ? "bg-primary text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
            {f.label}
            {f.value !== "ALL" && (
              <span className="ml-1.5 opacity-70">
                ({data.filter((d) => d.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <PackageCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Tidak ada data setoran</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <SetorCard key={item.id} item={item} ekpedisiList={ekpedisiList} />
          ))}
        </div>
      )}
    </div>
  );
}
