import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  Calendar,
  ClipboardList,
  Clock,
  Recycle,
  TrendingUp,
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

export default async function DashboardPage() {
  const session = await getSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username;

  // ─── Fetch Dynamic Stats & Charts ──────────────────────────────────────────
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      label: d.toLocaleDateString("id-ID", { month: "short" }),
    };
  }).reverse();

  const startDate = new Date(last6Months[0].year, last6Months[0].month, 1);
  const endDate = new Date(
    last6Months[last6Months.length - 1].year,
    last6Months[last6Months.length - 1].month + 1,
    0,
    23,
    59,
    59,
  );

  const [
    totalNasabah,
    langsungSelesai,
    ekspedisiSelesai,
    recentLangsung,
    recentEkspedisi,
    plastikLangsung,
    plastikEkspedisi,
    kartonLangsung,
    kartonEkspedisi,
    paperCupLangsung,
    paperCupEkspedisi,
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
        beratAktual: setorLangsung.beratAktual,
        totalPoin: setorLangsung.totalPoin,
      })
      .from(setorLangsung)
      .where(eq(setorLangsung.status, "SELESAI")),
    db
      .select({
        beratAktual: setorEkspedisi.beratAktual,
        totalPoin: setorEkspedisi.totalPoin,
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
      .select({ sum: sql<number>`sum(${setorLangsung.beratAktual})::float8` })
      .from(setorLangsung)
      .where(
        and(
          eq(setorLangsung.status, "SELESAI"),
          eq(setorLangsung.jenisSampah, "PLASTIK"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
    db
      .select({ sum: sql<number>`sum(${setorEkspedisi.beratAktual})::float8` })
      .from(setorEkspedisi)
      .where(
        and(
          eq(setorEkspedisi.status, "SELESAI"),
          eq(setorEkspedisi.jenisSampah, "PLASTIK"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
    db
      .select({ sum: sql<number>`sum(${setorLangsung.beratAktual})::float8` })
      .from(setorLangsung)
      .where(
        and(
          eq(setorLangsung.status, "SELESAI"),
          eq(setorLangsung.jenisSampah, "KARTON"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
    db
      .select({ sum: sql<number>`sum(${setorEkspedisi.beratAktual})::float8` })
      .from(setorEkspedisi)
      .where(
        and(
          eq(setorEkspedisi.status, "SELESAI"),
          eq(setorEkspedisi.jenisSampah, "KARTON"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
    db
      .select({ sum: sql<number>`sum(${setorLangsung.beratAktual})::float8` })
      .from(setorLangsung)
      .where(
        and(
          eq(setorLangsung.status, "SELESAI"),
          eq(setorLangsung.jenisSampah, "PAPER_CUP"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
    db
      .select({ sum: sql<number>`sum(${setorEkspedisi.beratAktual})::float8` })
      .from(setorEkspedisi)
      .where(
        and(
          eq(setorEkspedisi.status, "SELESAI"),
          eq(setorEkspedisi.jenisSampah, "PAPER_CUP"),
        ),
      )
      .then((r) => ({ _sum: { beratAktual: r[0]?.sum ?? 0 } })),
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
          gte(setorLangsung.createdAt, startDate),
          lte(setorLangsung.createdAt, endDate),
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
          gte(setorEkspedisi.createdAt, startDate),
          lte(setorEkspedisi.createdAt, endDate),
        ),
      ),
  ]);

  const monthlyStats = last6Months.map((m) => {
    const start = new Date(m.year, m.month, 1).getTime();
    const end = new Date(m.year, m.month + 1, 0, 23, 59, 59).getTime();

    let sum = 0;
    for (const s of langsungPeriod) {
      if (s.createdAt) {
        const time = new Date(s.createdAt).getTime();
        if (time >= start && time <= end) {
          sum += s.beratAktual || 0;
        }
      }
    }
    for (const s of ekspedisiPeriod) {
      if (s.createdAt) {
        const time = new Date(s.createdAt).getTime();
        if (time >= start && time <= end) {
          sum += s.beratAktual || 0;
        }
      }
    }
    return sum;
  });

  const setoranSelesai = [...langsungSelesai, ...ekspedisiSelesai];
  const recentActivities = [
    ...recentLangsung.map((a) => ({ ...a, jenisSetor: "LANGSUNG" as const })),
    ...recentEkspedisi.map((a) => ({ ...a, jenisSetor: "EKSPEDISI" as const })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const plastikStats = {
    _sum: {
      beratAktual:
        (plastikLangsung._sum.beratAktual || 0) +
        (plastikEkspedisi._sum.beratAktual || 0),
    },
  };
  const kartonStats = {
    _sum: {
      beratAktual:
        (kartonLangsung._sum.beratAktual || 0) +
        (kartonEkspedisi._sum.beratAktual || 0),
    },
  };
  const paperCupStats = {
    _sum: {
      beratAktual:
        (paperCupLangsung._sum.beratAktual || 0) +
        (paperCupEkspedisi._sum.beratAktual || 0),
    },
  };

  const totalSampah = setoranSelesai.reduce(
    (acc, s) => acc + (s.beratAktual || 0),
    0,
  );
  const totalPayout = setoranSelesai.reduce(
    (acc, s) => acc + (s.totalPoin || 0),
    0,
  );

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
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                Tren Setoran
              </h3>
              <p className="text-xs text-zinc-400">
                Statistik 6 bulan terakhir
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary/20" />
          </div>
          <WasteLineChart
            labels={last6Months.map((m) => m.label)}
            data={monthlyStats}
          />
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-1">
            Komposisi Sampah
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Perbandingan berat plastik, karton, & paper cup
          </p>
          <div className="flex items-center justify-center py-4">
            <WasteTypeChart
              plastik={plastikStats._sum.beratAktual || 0}
              karton={kartonStats._sum.beratAktual || 0}
              paperCup={paperCupStats._sum.beratAktual || 0}
            />
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
