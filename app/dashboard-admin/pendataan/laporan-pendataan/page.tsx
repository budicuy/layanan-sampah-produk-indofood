"use client";

import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Scale,
  Search,
  Tag,
  TrendingUp,
  Truck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LaporanBarChart, LaporanDonutChart } from "../../components/Charts";
import { getLaporanData } from "./actions";

// ─── Data helpers ────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

// ─── Type ────────────────────────────────────────────────────────────────────

export interface LaporanRow {
  id: string;
  nasabahId: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  hargaPerKg: number | null;
  totalSaldo: number | null;
  alamatPenjemputan: string;
  keterangan: string | null;
  selesaiAt: Date | null;
  createdAt: Date;
  nasabah: {
    id: string;
    nama: string;
    nik: string;
    kategori: string;
  };
  ekpedisi: {
    alamat: string;
    noTelp: string;
  } | null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const [setoran, setSetoran] = useState<LaporanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getLaporanData().then((data) => {
      setSetoran(data as unknown as LaporanRow[]);
      setIsLoading(false);
    });
  }, []);

  // ── Statistik ringkasan ────────────────────────────────────────────────────
  const totalBerat = setoran.reduce(
    (acc, s) => acc + (s.beratAktual ?? s.beratEstimasi),
    0,
  );
  const totalSaldo = setoran.reduce((acc, s) => acc + (s.totalSaldo ?? 0), 0);
  const nasabahUnik = new Set(setoran.map((s) => s.nasabahId)).size;
  const jumlahSelesai = setoran.length;

  // ── Data chart: berat per bulan per jenis ─────────────────────────────────
  const monthMap = new Map<string, { plastik: number; karton: number }>();
  for (const s of [...setoran].reverse()) {
    const key = getMonthLabel(new Date(s.selesaiAt ?? s.createdAt));
    if (!monthMap.has(key)) monthMap.set(key, { plastik: 0, karton: 0 });
    const entry = monthMap.get(key) ?? { plastik: 0, karton: 0 };
    const berat = s.beratAktual ?? s.beratEstimasi;
    if (s.jenisSampah === "PLASTIK") entry.plastik += berat;
    else entry.karton += berat;
    monthMap.set(key, entry);
  }
  const monthlyData = Array.from(monthMap.entries()).map(([label, v]) => ({
    label,
    plastik: Math.round(v.plastik * 10) / 10,
    karton: Math.round(v.karton * 10) / 10,
  }));

  // ── Data chart: komposisi per jenis ───────────────────────────────────────
  const typeData = setoran.reduce(
    (acc, s) => {
      const berat = s.beratAktual ?? s.beratEstimasi;
      if (s.jenisSampah === "PLASTIK") acc.plastik += berat;
      else acc.karton += berat;
      return acc;
    },
    { plastik: 0, karton: 0 },
  );
  typeData.plastik = Math.round(typeData.plastik * 10) / 10;
  typeData.karton = Math.round(typeData.karton * 10) / 10;

  const filtered = setoran.filter(
    (r) =>
      r.nasabah.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.nasabah.nik.toLowerCase().includes(search.toLowerCase()) ||
      r.jenisSampah.toLowerCase().includes(search.toLowerCase()),
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
          Laporan Setoran Sampah
        </h1>
        <p className="text-zinc-500 mt-1">
          Rekap transaksi setoran sampah yang telah selesai dan saldo
          dikreditkan.
        </p>
      </div>

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
            label: "Total Saldo",
            value: formatRupiah(totalSaldo),
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
            <p className="text-xs text-zinc-500 mt-1 font-medium">{label}</p>
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
                Perbandingan plastik & karton (kg)
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
              Proporsi berat plastik vs karton
            </p>
          </div>
          {typeData.plastik + typeData.karton > 0 ? (
            <>
              <LaporanDonutChart data={typeData} />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-lg font-bold text-red-700">
                    {typeData.plastik} kg
                  </p>
                  <p className="text-xs text-red-500 font-medium">Plastik</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-lg font-bold text-orange-700">
                    {typeData.karton} kg
                  </p>
                  <p className="text-xs text-orange-500 font-medium">Karton</p>
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
              Semua setoran yang sudah selesai dan saldo dikreditkan
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-50 px-4 py-2 rounded-xl">
            <CalendarDays size={14} />
            {jumlahSelesai} transaksi
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
                  "Harga/kg",
                  "Total Saldo",
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-8 py-14 text-center text-zinc-400 text-sm">
                    Tidak ada data setoran yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50/50 transition-colors">
                    {/* No */}
                    <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                      {idx + 1}
                    </td>

                    {/* Tanggal */}
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

                    {/* Nasabah */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {row.nasabah.nama[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm leading-tight">
                            {row.nasabah.nama}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {row.nasabah.nik}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                        {row.nasabah.kategori.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Jenis Sampah */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          row.jenisSampah === "PLASTIK"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                        <Tag size={11} />
                        {row.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"}
                      </span>
                    </td>

                    {/* Berat */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Scale size={13} className="text-zinc-400" />
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">
                            {row.beratAktual ?? row.beratEstimasi} kg
                          </p>
                          {row.beratAktual != null &&
                            row.beratAktual !== row.beratEstimasi && (
                              <p className="text-[10px] text-zinc-400">
                                Est: {row.beratEstimasi} kg
                              </p>
                            )}
                        </div>
                      </div>
                    </td>

                    {/* Harga/kg */}
                    <td className="px-6 py-5">
                      {row.hargaPerKg != null ? (
                        <span className="font-medium text-zinc-700 text-sm">
                          {formatRupiah(row.hargaPerKg)}/kg
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-sm">-</span>
                      )}
                    </td>

                    {/* Total Saldo */}
                    <td className="px-6 py-5">
                      {row.totalSaldo != null ? (
                        <div className="flex items-center gap-1.5">
                          <Wallet size={13} className="text-green-600" />
                          <span className="font-bold text-green-700 text-sm">
                            {formatRupiah(row.totalSaldo)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-sm">-</span>
                      )}
                    </td>

                    {/* Kurir */}
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
    </div>
  );
}
