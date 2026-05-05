import {
  CalendarDays,
  CheckCircle2,
  Scale,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LaporanBarChart, LaporanDonutChart } from "../components/Charts";
import LaporanTable from "./components/LaporanTable";

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LaporanPage() {
  // Ambil semua setoran yang sudah selesai — ini sumber laporan
  const setoran = await prisma.setorSampah.findMany({
    where: { status: "SELESAI" },
    orderBy: { selesaiAt: "desc" },
    include: {
      nasabah: {
        select: { id: true, nama: true, nik: true, kategori: true },
      },
      ekpedisi: {
        select: { alamat: true, noTelp: true },
      },
    },
  });

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
        <LaporanTable data={setoran} />
      </div>
    </div>
  );
}
