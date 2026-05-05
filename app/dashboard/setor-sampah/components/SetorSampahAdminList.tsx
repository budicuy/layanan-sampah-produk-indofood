"use client";

import {
  CheckCircle,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  Scale,
  Search,
  Tag,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date) {
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
          id={`btn-approve-${id}`}
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
          id={`btn-reject-${id}`}
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
    <div className="space-y-3">
      <select
        id={`select-ekpedisi-${id}`}
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
        id={`btn-tugaskan-${id}`}
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
    <button
      id={`btn-terima-${id}`}
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
    <div className="space-y-3">
      {error && (
        <p className="text-red-600 text-xs bg-red-50 p-3 rounded-xl">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`input-berat-${id}`}
            className="block text-xs text-zinc-500 mb-1.5 font-medium">
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
            className="w-full px-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]"
          />
        </div>
        <div>
          <label
            htmlFor={`input-harga-${id}`}
            className="block text-xs text-zinc-500 mb-1.5 font-medium">
            Harga/kg (Rp)
          </label>
          <input
            id={`input-harga-${id}`}
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
        id={`btn-kreditkan-${id}`}
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

const STEPS = ["Verifikasi", "Kurir", "Serah", "Terima", "Selesai"];

function StepProgress({ currentStep }: { currentStep: number }) {
  if (currentStep < 0) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((s, i) => {
        const stepNum = i + 2; // steps start at 2 (after MENUNGGU=1)
        const done = currentStep >= stepNum;
        const active = currentStep === stepNum - 1;
        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div
              className={`h-1.5 rounded-full flex-1 transition-all ${
                done ? "bg-green-400" : active ? "bg-primary/60" : "bg-zinc-200"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function SetorCard({
  item,
  ekpedisiList,
}: {
  item: SetorSampahItem;
  ekpedisiList: Ekpedisi[];
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
          {item.nasabah.nama[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-zinc-900 text-sm truncate">
              {item.nasabah.nama}
            </p>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls} whitespace-nowrap`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Tag size={11} className="text-zinc-400" />
              {item.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"}
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
          <StepProgress currentStep={cfg.step} />
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
        {item.status === "MENUNGGU_VERIFIKASI" && (
          <ActionSection title="Verifikasi Data">
            <PanelVerifikasi id={item.id} />
          </ActionSection>
        )}
        {item.status === "TERVERIFIKASI" && (
          <ActionSection title="Tugaskan Kurir">
            <PanelEkpedisi id={item.id} ekpedisiList={ekpedisiList} />
          </ActionSection>
        )}
        {item.status === "SUDAH_DISERAHKAN" && (
          <ActionSection title="Konfirmasi Penerimaan">
            <PanelTerimaSampah id={item.id} />
          </ActionSection>
        )}
        {item.status === "SAMPAH_DITERIMA" && (
          <ActionSection title="Verifikasi Akhir & Kreditkan Saldo">
            <PanelVerifikasiAkhir id={item.id} />
          </ActionSection>
        )}
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
        <p className="text-xs text-zinc-700 mt-0.5 break-words leading-relaxed">
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

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

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

// ─── Main List Component ─────────────────────────────────────────────────────

export default function SetorSampahAdminList({
  data,
  ekpedisiList,
}: {
  data: SetorSampahItem[];
  ekpedisiList: Ekpedisi[];
}) {
  const [filter, setFilter] = useState<StatusSetorSampah | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result =
      filter === "ALL" ? data : data.filter((d) => d.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.nasabah.nama.toLowerCase().includes(q) ||
          d.nasabah.nik.includes(q) ||
          d.nasabah.noTelp.includes(q),
      );
    }
    return result;
  }, [data, filter, search]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          id="search-setor-sampah"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, NIK, atau no. telp nasabah..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-zinc-400 min-h-[48px]"
        />
      </div>

      {/* Filter tabs — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === "ALL"
              ? data.length
              : data.filter((d) => d.status === f.value).length;
          return (
            <button
              key={f.value}
              id={`filter-${f.value}`}
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
        <div className="text-center py-16 text-zinc-400">
          <PackageCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium text-sm">Tidak ada data setoran</p>
          {search && (
            <p className="text-xs mt-1">Coba ubah kata kunci pencarian Anda</p>
          )}
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
