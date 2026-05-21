"use client";

import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Scale,
  Search,
  Sparkles,
  Tag,
  Ticket,
  TrendingUp,
  Truck,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  LaporanBarChart,
  LaporanDonutChart,
} from "@/app/dashboard-admin/components/Charts";
import { getLaporanData } from "@/app/dashboard-admin/pendataan/laporan-pendataan/actions";

// ─── Data helpers ────────────────────────────────────────────────────────────

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LaporanRow {
  id: string;
  nasabahId: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  poinPerKg: number | null;
  totalPoin: number | null;
  alamatPenjemputan: string;
  keterangan: string | null;
  selesaiAt: Date | null;
  createdAt: Date;
  nasabah: {
    id: string;
    nik: string;
    kategori: string;
    user: {
      name: string;
    };
  };
  ekpedisi: {
    alamat: string;
    noTelp: string;
  } | null;
}

export interface PencairanRow {
  id: string;
  nasabahId: string;
  jumlah: number;
  status: "DIAJUKAN" | "DIVERIFIKASI" | "DICAIRKAN" | "DITOLAK";
  catatan: string | null;
  catatanAdmin: string | null;
  buktiFoto: string | null;
  diajukanAt: Date;
  diverifikasi: Date | null;
  dicairkan: Date | null;
  createdAt: Date;
  nasabah: {
    id: string;
    nik: string;
    user: {
      name: string;
      username: string;
    };
  };
}

export interface KuponRow {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  poinCost: number;
  status: "AKTIF" | "DIGUNAKAN" | "EXPIRED";
  nasabahId: string;
  createdAt: Date;
  digunakanAt: Date | null;
  nasabah: {
    id: string;
    nik: string;
    user: {
      name: string;
    };
  };
}

const STATUS_PENCAIRAN_CONFIG = {
  DIAJUKAN: {
    label: "Diajukan",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DICAIRKAN: {
    label: "Dicairkan",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DITOLAK: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

const STATUS_KUPON_CONFIG = {
  AKTIF: {
    label: "Aktif",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DIGUNAKAN: {
    label: "Digunakan",
    color: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    color: "bg-red-50 text-red-600 border-red-200",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const [setoran, setSetoran] = useState<LaporanRow[]>([]);
  const [pencairan, setPencairan] = useState<PencairanRow[]>([]);
  const [kupon, setKupon] = useState<KuponRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"setoran" | "pencairan" | "kupon">(
    "setoran",
  );
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    getLaporanData().then((data) => {
      setSetoran((data.setoran || []) as unknown as LaporanRow[]);
      setPencairan((data.pencairan || []) as unknown as PencairanRow[]);
      setKupon((data.kupon || []) as unknown as KuponRow[]);
      setIsLoading(false);
    });
  }, []);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  // ── Statistik Setoran ──────────────────────────────────────────────────────
  const totalBerat = setoran.reduce(
    (acc, s) => acc + (s.beratAktual ?? s.beratEstimasi),
    0,
  );
  const totalPoin = setoran.reduce((acc, s) => acc + (s.totalPoin ?? 0), 0);
  const nasabahUnik = new Set(setoran.map((s) => s.nasabahId)).size;
  const jumlahSelesai = setoran.length;

  // ── Data Chart Setoran ─────────────────────────────────────────────────────
  const monthMap = new Map<
    string,
    { plastik: number; karton: number; paperCup: number }
  >();
  for (const s of [...setoran].reverse()) {
    const key = getMonthLabel(new Date(s.selesaiAt ?? s.createdAt));
    if (!monthMap.has(key)) {
      monthMap.set(key, { plastik: 0, karton: 0, paperCup: 0 });
    }
    const entry = monthMap.get(key) ?? { plastik: 0, karton: 0, paperCup: 0 };
    const berat = s.beratAktual ?? s.beratEstimasi;
    if (s.jenisSampah === "PLASTIK") entry.plastik += berat;
    else if (s.jenisSampah === "KARTON") entry.karton += berat;
    else entry.paperCup += berat;
    monthMap.set(key, entry);
  }
  const monthlyData = Array.from(monthMap.entries()).map(([label, v]) => ({
    label,
    plastik: Math.round(v.plastik * 10) / 10,
    karton: Math.round(v.karton * 10) / 10,
    paperCup: Math.round(v.paperCup * 10) / 10,
  }));

  const typeData = setoran.reduce(
    (acc, s) => {
      const berat = s.beratAktual ?? s.beratEstimasi;
      if (s.jenisSampah === "PLASTIK") acc.plastik += berat;
      else if (s.jenisSampah === "KARTON") acc.karton += berat;
      else acc.paperCup += berat;
      return acc;
    },
    { plastik: 0, karton: 0, paperCup: 0 },
  );
  typeData.plastik = Math.round(typeData.plastik * 10) / 10;
  typeData.karton = Math.round(typeData.karton * 10) / 10;
  typeData.paperCup = Math.round(typeData.paperCup * 10) / 10;

  // ── Statistik Pencairan ────────────────────────────────────────────────────
  const totalCairNominal = pencairan
    .filter((p) => p.status === "DICAIRKAN")
    .reduce((acc, p) => acc + p.jumlah, 0);
  const totalDiajukanNominal = pencairan
    .filter((p) => p.status === "DIAJUKAN" || p.status === "DIVERIFIKASI")
    .reduce((acc, p) => acc + p.jumlah, 0);
  const totalTransCair = pencairan.filter(
    (p) => p.status === "DICAIRKAN",
  ).length;
  const totalTransPending = pencairan.filter(
    (p) => p.status === "DIAJUKAN" || p.status === "DIVERIFIKASI",
  ).length;

  // ── Statistik Kupon ────────────────────────────────────────────────────────
  const totalKuponDitukar = kupon.length;
  const totalPoinTukar = kupon.reduce((acc, k) => acc + k.poinCost, 0);
  const totalKuponAktif = kupon.filter((k) => k.status === "AKTIF").length;
  const totalKuponDigunakan = kupon.filter(
    (k) => k.status === "DIGUNAKAN",
  ).length;

  // ── Filtered List ──────────────────────────────────────────────────────────
  const filteredSetoran = setoran.filter(
    (r) =>
      r.nasabah.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.nasabah.nik.toLowerCase().includes(search.toLowerCase()) ||
      r.jenisSampah.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPencairan = pencairan.filter(
    (p) =>
      p.nasabah.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nasabah.nik.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredKupon = kupon.filter(
    (k) =>
      k.nasabah.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      k.kode.toLowerCase().includes(search.toLowerCase()) ||
      k.nama.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-zinc-900">
          Laporan Layanan & Reward
        </h1>
        <p className="text-zinc-500 mt-1">
          Rekap data transaksi setoran sampah, pencairan dana nasabah bank
          sampah, dan penukaran kupon reward.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 overflow-x-auto scrollbar-none gap-2">
        {[
          { id: "setoran", label: "Setoran Sampah", count: setoran.length },
          { id: "pencairan", label: "Pencairan Dana", count: pencairan.length },
          { id: "kupon", label: "Penukaran Kupon", count: kupon.length },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id as any);
              setSearch("");
            }}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}>
            {t.label}
            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md text-[10px] font-semibold">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── TAB SETORAN SAMPAH ────────────────────────────────────────────── */}
      {activeTab === "setoran" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: CheckCircle2,
                label: "Total Setoran",
                value: jumlahSelesai,
                sub: "Transaksi selesai",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: Scale,
                label: "Total Berat",
                value: `${totalBerat.toFixed(1)} kg`,
                sub: "Berat aktual timbang",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: Wallet,
                label: "Total Poin",
                value: `${totalPoin} Poin`,
                sub: "Dikreditkan ke nasabah",
                color: "text-primary bg-red-50",
              },
              {
                icon: Users,
                label: "Nasabah Aktif",
                value: nasabahUnik,
                sub: "Unik berkontribusi",
                color: "text-purple-600 bg-purple-50",
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div
                key={label}
                className="bg-white rounded-[24px] border border-zinc-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-heading font-bold text-zinc-900 leading-tight">
                  {value}
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  {label}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart — berat per bulan */}
            <div className="lg:col-span-2 bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-heading font-bold text-zinc-900">
                    Berat Sampah per Bulan
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Perbandingan plastik, karton, & paper cup (kg)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <TrendingUp size={12} />
                  Real Data
                </div>
              </div>
              {monthlyData.length > 0 ? (
                <LaporanBarChart data={monthlyData} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-zinc-400 text-sm">
                  Belum ada data setoran selesai
                </div>
              )}
            </div>

            {/* Donut — komposisi per jenis */}
            <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-heading font-bold text-zinc-900">
                  Komposisi Jenis
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Proporsi berat plastik, karton, & paper cup
                </p>
              </div>
              {typeData.plastik + typeData.karton + typeData.paperCup > 0 ? (
                <>
                  <LaporanDonutChart data={typeData} />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-red-50 rounded-xl">
                      <p className="text-sm font-bold text-red-700">
                        {typeData.plastik} kg
                      </p>
                      <p className="text-[10px] text-red-500 font-medium">
                        Plastik
                      </p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-xl">
                      <p className="text-sm font-bold text-orange-700">
                        {typeData.karton} kg
                      </p>
                      <p className="text-[10px] text-orange-500 font-medium">
                        Karton
                      </p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-xl">
                      <p className="text-sm font-bold text-blue-700">
                        {typeData.paperCup} kg
                      </p>
                      <p className="text-[10px] text-blue-500 font-medium">
                        Paper Cup
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-zinc-400 text-sm">
                  Belum ada data
                </div>
              )}
            </div>
          </div>

          {/* Tabel data */}
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-heading font-bold text-zinc-900">
                  Detail Transaksi Setoran
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Semua setoran yang sudah selesai dan poin dikreditkan
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl">
                <CalendarDays size={14} />
                {filteredSetoran.length} transaksi
              </div>
            </div>

            {/* Search bar */}
            <div className="px-8 py-4 border-b border-zinc-100">
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama nasabah / NIK / jenis..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80">
                    {[
                      "No",
                      "Tanggal Selesai",
                      "Nasabah",
                      "Kategori",
                      "Jenis Sampah",
                      "Berat",
                      "Poin/kg",
                      "Total Poin",
                      "Kurir",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredSetoran.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-8 py-14 text-center text-zinc-400 text-sm">
                        Tidak ada data setoran yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredSetoran.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm">
                              <Calendar size={11} className="text-zinc-400" />
                              {new Date(
                                row.selesaiAt ?? row.createdAt,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                              <Clock size={11} />
                              {new Date(
                                row.selesaiAt ?? row.createdAt,
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {row.nasabah.user?.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 text-sm leading-tight">
                                {row.nasabah.user?.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {row.nasabah.nik}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                            {row.nasabah.kategori.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                              row.jenisSampah === "PLASTIK"
                                ? "bg-red-100 text-red-700"
                                : row.jenisSampah === "KARTON"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}>
                            <Tag size={11} />
                            {row.jenisSampah === "PLASTIK"
                              ? "Plastik"
                              : row.jenisSampah === "KARTON"
                                ? "Karton"
                                : "Paper Cup"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Scale size={13} className="text-zinc-400" />
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">
                                {row.beratAktual ?? row.beratEstimasi} kg
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {row.poinPerKg != null ? (
                            <span className="font-medium text-zinc-700 text-sm">
                              {row.poinPerKg} poin/kg
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {row.totalPoin != null ? (
                            <div className="flex items-center gap-1.5">
                              <Wallet size={13} className="text-green-600" />
                              <span className="font-bold text-green-700 text-sm">
                                {row.totalPoin} poin
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {row.ekpedisi ? (
                            <div className="flex items-start gap-1.5">
                              <Truck
                                size={13}
                                className="text-zinc-400 mt-0.5 shrink-0"
                              />
                              <div>
                                <p className="text-xs font-bold text-zinc-700">
                                  {row.ekpedisi.alamat}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  {row.ekpedisi.noTelp}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                              <User size={12} />
                              Langsung
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB PENCAIRAN DANA ────────────────────────────────────────────── */}
      {activeTab === "pencairan" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Wallet,
                label: "Total Cair",
                value: formatRupiah(totalCairNominal),
                sub: "Berhasil ditransfer",
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                icon: Clock,
                label: "Total Diajukan",
                value: formatRupiah(totalDiajukanNominal),
                sub: "Menunggu verifikasi",
                color: "text-amber-600 bg-amber-50",
              },
              {
                icon: CheckCircle2,
                label: "Pencairan Selesai",
                value: `${totalTransCair} Transaksi`,
                sub: "Telah diproses",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: FileText,
                label: "Pencairan Pending",
                value: `${totalTransPending} Transaksi`,
                sub: "Belum ditransfer",
                color: "text-purple-600 bg-purple-50",
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div
                key={label}
                className="bg-white rounded-[24px] border border-zinc-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-xl font-heading font-bold text-zinc-900 leading-tight">
                  {value}
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  {label}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabel data */}
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-heading font-bold text-zinc-900">
                  Riwayat Pencairan Dana
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rekap pengajuan penarikan dana dari nasabah tipe bank sampah
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl">
                <CalendarDays size={14} />
                {filteredPencairan.length} total pengajuan
              </div>
            </div>

            {/* Search bar */}
            <div className="px-8 py-4 border-b border-zinc-100">
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama nasabah / NIK / status..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80">
                    {[
                      "No",
                      "Tanggal Pengajuan",
                      "Nasabah",
                      "Nominal",
                      "Status",
                      "Catatan",
                      "Admin Note",
                      "Tanggal Cair",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPencairan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-8 py-14 text-center text-zinc-400 text-sm">
                        Tidak ada data pencairan yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredPencairan.map((row, idx) => {
                      const cfg = STATUS_PENCAIRAN_CONFIG[row.status];
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-900 font-bold text-sm">
                                {new Date(row.diajukanAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span className="text-zinc-400 text-xs flex items-center gap-1">
                                <Clock size={11} />
                                {new Date(row.diajukanAt).toLocaleTimeString(
                                  "id-ID",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-bold text-zinc-900 text-sm leading-tight">
                                {row.nasabah.user?.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                @{row.nasabah.user?.username} (NIK:{" "}
                                {row.nasabah.nik})
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-black text-zinc-900 text-sm">
                              {formatRupiah(row.jumlah)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-xs text-zinc-500 max-w-[150px] truncate">
                            {row.catatan || "-"}
                          </td>
                          <td className="px-6 py-5 text-xs text-zinc-500 max-w-[150px] truncate">
                            {row.catatanAdmin || "-"}
                          </td>
                          <td className="px-6 py-5 text-xs text-zinc-600">
                            {row.dicairkan ? (
                              <span>
                                {new Date(row.dicairkan).toLocaleDateString(
                                  "id-ID",
                                )}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {row.buktiFoto ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhoto(row.buktiFoto ?? "")
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Lihat Bukti Transfer">
                                <Eye size={16} />
                              </button>
                            ) : (
                              <span className="text-zinc-300 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB PENUKARAN KUPON ───────────────────────────────────────────── */}
      {activeTab === "kupon" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Ticket,
                label: "Kupon Ditukarkan",
                value: `${totalKuponDitukar} Kupon`,
                sub: "Total kupon dibuat",
                color: "text-primary bg-red-50",
              },
              {
                icon: Wallet,
                label: "Poin Dibelanjakan",
                value: `${totalPoinTukar} Poin`,
                sub: "Dari keseluruhan kupon",
                color: "text-amber-600 bg-amber-50",
              },
              {
                icon: Sparkles,
                label: "Kupon Aktif (Belum Pakai)",
                value: `${totalKuponAktif} Kupon`,
                sub: "Siap digunakan nasabah",
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                icon: CheckCircle2,
                label: "Kupon Terpakai",
                value: `${totalKuponDigunakan} Kupon`,
                sub: "Sudah di-scan/claim",
                color: "text-purple-600 bg-purple-50",
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div
                key={label}
                className="bg-white rounded-[24px] border border-zinc-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-xl font-heading font-bold text-zinc-900 leading-tight">
                  {value}
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  {label}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabel data */}
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-heading font-bold text-zinc-900">
                  Daftar Penukaran Kupon
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rekap data penukaran poin nasabah menjadi kupon reward
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl">
                <CalendarDays size={14} />
                {filteredKupon.length} total kupon
              </div>
            </div>

            {/* Search bar */}
            <div className="px-8 py-4 border-b border-zinc-100">
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode kupon / nama kupon / nasabah..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80">
                    {[
                      "No",
                      "Kode Kupon",
                      "Tanggal Tukar",
                      "Reward Kupon",
                      "Biaya Poin",
                      "Status",
                      "Nasabah",
                      "Tanggal Digunakan",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredKupon.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-8 py-14 text-center text-zinc-400 text-sm">
                        Tidak ada data kupon yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredKupon.map((row, idx) => {
                      const cfg = STATUS_KUPON_CONFIG[row.status];
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-mono font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-800 text-xs">
                              {row.kode}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-900 font-bold text-sm">
                                {new Date(row.createdAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-zinc-900 text-sm leading-tight">
                              {row.nama}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-bold text-red-600 text-sm">
                              -{row.poinCost} poin
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-zinc-800 font-medium">
                            {row.nasabah.user?.name}
                          </td>
                          <td className="px-6 py-5 text-xs text-zinc-500">
                            {row.digunakanAt ? (
                              <span>
                                {new Date(row.digunakanAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal View Photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-black/40 text-white hover:bg-black/60 rounded-full p-2 transition-colors z-10">
              <X size={18} />
            </button>
            <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt="Bukti Transfer"
                className="max-h-full object-contain max-w-full"
              />
            </div>
            <div className="p-5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50">
              <span className="text-xs text-zinc-500 font-medium">
                Bukti Pencairan Dana
              </span>
              <a
                href={selectedPhoto}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 font-bold hover:underline">
                Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
