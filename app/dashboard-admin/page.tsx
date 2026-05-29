import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  Calendar,
  ClipboardList,
  Clock,
  Recycle,
  Users,
  Wallet,
} from "lucide-react";
import { getSession } from "@/app/login/auth/session";
import { db } from "@/lib/db";
import {
  nasabah,
  pencairan,
  setorEkspedisi,
  setorLangsung,
} from "@/lib/db/schema";
import { WasteLineChart, WasteTypeChart } from "./components/Charts";
import LiveClock from "./components/Clock";
import { CompFilters, TrendFilters } from "./components/Filters";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username;

  const searchParams = await props.searchParams;

  const filterTahunTrend =
    typeof searchParams.trendYear === "string"
      ? searchParams.trendYear
      : String(new Date().getFullYear());
  const filterBulanTrend =
    typeof searchParams.trendMonth === "string"
      ? searchParams.trendMonth
      : "ALL";
  const filterTahunKomposisi =
    typeof searchParams.compYear === "string"
      ? searchParams.compYear
      : String(new Date().getFullYear());

  // ─── Filter Dynamic Dates ──────────────────────────────────────────────────
  let trendStartDate: Date;
  let trendEndDate: Date;

  if (filterBulanTrend === "ALL") {
    trendStartDate = new Date(Number(filterTahunTrend), 0, 1, 0, 0, 0);
    trendEndDate = new Date(Number(filterTahunTrend), 11, 31, 23, 59, 59);
  } else {
    const mVal = Number(filterBulanTrend);
    trendStartDate = new Date(Number(filterTahunTrend), mVal, 1, 0, 0, 0);
    trendEndDate = new Date(Number(filterTahunTrend), mVal + 1, 0, 23, 59, 59);
  }

  const compStartDate = new Date(Number(filterTahunKomposisi), 0, 1, 0, 0, 0);
  const compEndDate = new Date(
    Number(filterTahunKomposisi),
    11,
    31,
    23,
    59,
    59,
  );

  const [
    totalNasabah,
    langsungSelesaiResult,
    ekspedisiSelesaiResult,
    recentLangsung,
    recentEkspedisi,
    langsungComposition,
    ekspedisiComposition,
    pencairanPendingCount,
    langsungPeriod,
    ekspedisiPeriod,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(nasabah)
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        totalBerat: sql<number>`sum(coalesce("beratAktual", 0))::float8`,
        totalPoin: sql<number>`sum(coalesce("totalPoin", 0))::int`,
      })
      .from(setorLangsung)
      .where(eq(setorLangsung.status, "SELESAI")),
    db
      .select({
        totalBerat: sql<number>`sum(coalesce("beratAktual", 0))::float8`,
        totalPoin: sql<number>`sum(coalesce("totalPoin", 0))::int`,
      })
      .from(setorEkspedisi)
      .where(eq(setorEkspedisi.status, "SELESAI")),
    db.query.setorLangsung.findMany({
      orderBy: (setorLangsung, { desc }) => [desc(setorLangsung.createdAt)],
      limit: 3,
      with: {
        nasabah: {
          columns: {},
          with: {
            user: {
              columns: { name: true },
            },
          },
        },
      },
    }),
    db.query.setorEkspedisi.findMany({
      orderBy: (setorEkspedisi, { desc }) => [desc(setorEkspedisi.createdAt)],
      limit: 3,
      with: {
        nasabah: {
          columns: {},
          with: {
            user: {
              columns: { name: true },
            },
          },
        },
      },
    }),
    db
      .select({
        jenisSampah: setorLangsung.jenisSampah,
        sum: sql<number>`sum(${setorLangsung.beratAktual})::float8`,
      })
      .from(setorLangsung)
      .where(
        and(
          eq(setorLangsung.status, "SELESAI"),
          gte(setorLangsung.createdAt, compStartDate),
          lte(setorLangsung.createdAt, compEndDate),
        ),
      )
      .groupBy(setorLangsung.jenisSampah),
    db
      .select({
        jenisSampah: setorEkspedisi.jenisSampah,
        sum: sql<number>`sum(${setorEkspedisi.beratAktual})::float8`,
      })
      .from(setorEkspedisi)
      .where(
        and(
          eq(setorEkspedisi.status, "SELESAI"),
          gte(setorEkspedisi.createdAt, compStartDate),
          lte(setorEkspedisi.createdAt, compEndDate),
        ),
      )
      .groupBy(setorEkspedisi.jenisSampah),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pencairan)
      .where(eq(pencairan.status, "DIAJUKAN"))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({
        beratAktual: setorLangsung.beratAktual,
        createdAt: setorLangsung.createdAt,
      })
      .from(setorLangsung)
      .where(
        and(
          eq(setorLangsung.status, "SELESAI"),
          gte(setorLangsung.createdAt, trendStartDate),
          lte(setorLangsung.createdAt, trendEndDate),
        ),
      ),
    db
      .select({
        beratAktual: setorEkspedisi.beratAktual,
        createdAt: setorEkspedisi.createdAt,
      })
      .from(setorEkspedisi)
      .where(
        and(
          eq(setorEkspedisi.status, "SELESAI"),
          gte(setorEkspedisi.createdAt, trendStartDate),
          lte(setorEkspedisi.createdAt, trendEndDate),
        ),
      ),
  ]);

  const langsungSelesai = langsungSelesaiResult[0] || {
    totalBerat: 0,
    totalPoin: 0,
  };
  const ekspedisiSelesai = ekspedisiSelesaiResult[0] || {
    totalBerat: 0,
    totalPoin: 0,
  };

  // Kalkulasi data point chart trend (bulanan atau harian)
  let chartLabels: string[];
  let chartDataPoints: number[];

  if (filterBulanTrend === "ALL") {
    const monthsList = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    chartLabels = monthsList;
    chartDataPoints = Array.from({ length: 12 }, () => 0);

    for (const s of langsungPeriod) {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        chartDataPoints[d.getMonth()] += s.beratAktual || 0;
      }
    }
    for (const s of ekspedisiPeriod) {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        chartDataPoints[d.getMonth()] += s.beratAktual || 0;
      }
    }
  } else {
    const totalDays = trendEndDate.getDate();
    chartLabels = Array.from({ length: totalDays }, (_, i) => String(i + 1));
    chartDataPoints = Array.from({ length: totalDays }, () => 0);

    for (const s of langsungPeriod) {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        chartDataPoints[d.getDate() - 1] += s.beratAktual || 0;
      }
    }
    for (const s of ekspedisiPeriod) {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        chartDataPoints[d.getDate() - 1] += s.beratAktual || 0;
      }
    }
  }

  const recentActivities = [
    ...recentLangsung.map((a) => ({ ...a, jenisSetor: "LANGSUNG" as const })),
    ...recentEkspedisi.map((a) => ({ ...a, jenisSetor: "EKSPEDISI" as const })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const getSumForType = (type: string) => {
    const sumLangsung =
      langsungComposition.find((c) => c.jenisSampah === type)?.sum ?? 0;
    const sumEkspedisi =
      ekspedisiComposition.find((c) => c.jenisSampah === type)?.sum ?? 0;
    return sumLangsung + sumEkspedisi;
  };

  const plastikKg = getSumForType("PLASTIK");
  const kartonKg = getSumForType("KARTON");
  const paperCupKg = getSumForType("PAPER_CUP");
  const totalTipe = plastikKg + kartonKg + paperCupKg;

  const plastikPersen =
    totalTipe > 0 ? ((plastikKg / totalTipe) * 100).toFixed(1) : "0.0";
  const kartonPersen =
    totalTipe > 0 ? ((kartonKg / totalTipe) * 100).toFixed(1) : "0.0";
  const paperCupPersen =
    totalTipe > 0 ? ((paperCupKg / totalTipe) * 100).toFixed(1) : "0.0";

  const totalSampah =
    (langsungSelesai.totalBerat ?? 0) + (ekspedisiSelesai.totalBerat ?? 0);
  const totalPayout =
    (langsungSelesai.totalPoin ?? 0) + (ekspedisiSelesai.totalPoin ?? 0);

  const stats = [
    {
      icon: Recycle,
      label: "Total Sampah",
      value: `${totalSampah.toFixed(1)} kg`,
      subValue: "Seluruh setoran selesai",
    },
    {
      icon: Users,
      label: "Total Nasabah",
      value: totalNasabah.toString(),
      subValue: "Nasabah terdaftar",
    },
    {
      icon: Wallet,
      label: "Poin Terbayar",
      value: `${totalPayout} Poin`,
      subValue: "Poin tersalurkan",
    },
    {
      icon: ClipboardList,
      label: "Pencairan Pending",
      value: `${pencairanPendingCount} Pengajuan`,
      subValue: "Menunggu transfer",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Halo, {displayName}! 👋
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Ringkasan data operasional SICUAN hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-zinc-200 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-zinc-600">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, subValue }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/5 text-primary">
                <Icon className="w-6 h-6" />
              </div>
              <div className="px-2 py-1 bg-zinc-50 text-zinc-400 text-[10px] font-bold rounded-md border border-zinc-100 uppercase tracking-wider">
                Statistik
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
                {label}
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 leading-tight">
                {value}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium italic">
                {subValue}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col">
          <div>
            <div className="flex items-center justify-between gap-4 mb-1">
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                Tren Setoran
              </h3>
              <TrendFilters
                currentYear={filterTahunTrend}
                currentMonth={filterBulanTrend}
              />
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              {filterBulanTrend === "ALL"
                ? `Statistik setoran bulanan tahun ${filterTahunTrend}`
                : `Statistik setoran harian bulan ${
                    [
                      "Januari",
                      "Februari",
                      "Maret",
                      "April",
                      "Mei",
                      "Juni",
                      "Juli",
                      "Agustus",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ][Number(filterBulanTrend)]
                  } ${filterTahunTrend}`}
            </p>
          </div>
          <div className="flex-1 flex items-center w-full">
            <WasteLineChart labels={chartLabels} data={chartDataPoints} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                Komposisi Sampah
              </h3>
              <CompFilters currentYear={filterTahunKomposisi} />
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              Perbandingan berat plastik, karton, & paper cup tahun{" "}
              {filterTahunKomposisi}
            </p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 justify-center py-2 w-full">
            <div className="w-40 h-40 shrink-0">
              <WasteTypeChart
                plastik={plastikKg}
                karton={kartonKg}
                paperCup={paperCupKg}
              />
            </div>
            <div className="flex flex-col gap-2.5 text-xs font-bold text-zinc-600 w-full max-w-[200px]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/50 border border-red-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span className="text-red-700">Plastik</span>
                </div>
                <span className="text-red-800">
                  {plastikKg.toFixed(1)} kg ({plastikPersen}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/50 border border-orange-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <span className="text-orange-700">Karton</span>
                </div>
                <span className="text-orange-800">
                  {kartonKg.toFixed(1)} kg ({kartonPersen}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50 border border-blue-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-blue-700">Paper Cup</span>
                </div>
                <span className="text-blue-800">
                  {paperCupKg.toFixed(1)} kg ({paperCupPersen}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Aktivitas Setoran Terkini
            </h3>
            <p className="text-xs text-zinc-400">Transaksi terbaru hari ini</p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline px-2 py-1">
            Lihat Semua
          </button>
        </div>
        <div className="divide-y divide-zinc-100">
          {recentActivities.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm font-medium">
              Belum ada aktivitas transaksi.
            </div>
          ) : (
            recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-zinc-900 text-sm truncate">
                      {act.nasabah.user?.name}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        act.status === "SELESAI"
                          ? "bg-green-50 text-green-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                      {act.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium truncate">
                    {act.jenisSampah} •{" "}
                    {act.beratAktual || act.beratEstimasi || 0} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900 text-sm">
                    {act.totalPoin ? `${act.totalPoin} Poin` : "Pending"}
                  </p>
                  <p className="text-[10px] font-medium text-zinc-400 uppercase">
                    {new Date(act.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
