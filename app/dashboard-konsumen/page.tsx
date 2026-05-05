import {
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Recycle,
  Scale,
  Tag,
  Wallet,
} from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ConsumerDonutChart,
  ConsumerLineChart,
} from "./components/ConsumerCharts";

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

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu",
    cls: "bg-amber-100 text-amber-700",
  },
  TERVERIFIKASI: { label: "Terverifikasi", cls: "bg-blue-100 text-blue-700" },
  DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
  DALAM_PENJEMPUTAN: {
    label: "Penjemputan",
    cls: "bg-purple-100 text-purple-700",
  },
  SUDAH_DISERAHKAN: {
    label: "Diserahkan",
    cls: "bg-indigo-100 text-indigo-700",
  },
  SAMPAH_DITERIMA: { label: "Diterima", cls: "bg-teal-100 text-teal-700" },
  SELESAI: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ConsumerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const displayName = user?.name ?? user?.username ?? user?.email;

  // Fetch nasabah linked to this user
  const nasabah = user
    ? await prisma.nasabah.findUnique({
        where: { userId: user.id },
        select: {
          saldo: true,
          noRek: true,
          alamat: true,
          setorSampah: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              jenisSampah: true,
              beratEstimasi: true,
              beratAktual: true,
              totalSaldo: true,
              status: true,
              selesaiAt: true,
              createdAt: true,
            },
          },
        },
      })
    : null;

  const setoran = nasabah?.setorSampah ?? [];
  const setoranSelesai = setoran.filter((s) => s.status === "SELESAI");

  // Stats
  const totalBerat = setoranSelesai.reduce(
    (a, s) => a + (s.beratAktual ?? s.beratEstimasi),
    0,
  );
  const totalSaldo = nasabah?.saldo ?? 0;
  const totalSetoran = setoran.length;
  const selesaiCount = setoranSelesai.length;

  // Chart: monthly data (last 6 months)
  const now = new Date();
  const monthlyData: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    const value = setoranSelesai
      .filter((s) => {
        const sd = new Date(s.selesaiAt ?? s.createdAt);
        return (
          sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()
        );
      })
      .reduce((a, s) => a + (s.beratAktual ?? s.beratEstimasi), 0);
    monthlyData.push({ label, value: Math.round(value * 10) / 10 });
  }

  // Chart: composition
  const plastikKg = setoranSelesai
    .filter((s) => s.jenisSampah === "PLASTIK")
    .reduce((a, s) => a + (s.beratAktual ?? s.beratEstimasi), 0);
  const kartonKg = setoranSelesai
    .filter((s) => s.jenisSampah === "KARTON")
    .reduce((a, s) => a + (s.beratAktual ?? s.beratEstimasi), 0);

  // Stats cards
  const stats = [
    {
      icon: Scale,
      label: "Total Sampah",
      value: `${totalBerat.toFixed(1)} kg`,
      sub: `${selesaiCount} setoran selesai`,
      color: "text-red-600",
      bg: "bg-red-50 border-red-100",
      iconBg: "bg-red-100",
    },
    {
      icon: Wallet,
      label: "Saldo Tabungan",
      value: formatRupiah(totalSaldo),
      sub: nasabah ? `Rek: ${nasabah.noRek}` : "Belum terdaftar",
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      iconBg: "bg-green-100",
    },
    {
      icon: Package,
      label: "Total Setoran",
      value: `${totalSetoran}`,
      sub: `${selesaiCount} selesai · ${totalSetoran - selesaiCount} proses`,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      iconBg: "bg-blue-100",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900">
            Halo, {displayName}! 👋
          </h1>
          <p className="text-zinc-500 mt-1 text-sm md:text-base">
            Pantau kontribusi lingkungan Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-zinc-100 shadow-sm">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600">
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 md:p-6 ${s.bg} transition-all hover:shadow-md`}>
            <div
              className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p
              className={`text-2xl md:text-3xl font-heading font-bold ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-1">{s.label}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 font-heading mb-4">
            Statistik Setoran Anda
          </h3>
          <ConsumerLineChart data={monthlyData} />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 font-heading mb-4">
            Komposisi Sampah Anda
          </h3>
          <ConsumerDonutChart
            data={{
              plastik: Math.round(plastikKg * 10) / 10,
              karton: Math.round(kartonKg * 10) / 10,
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 font-heading mb-4">
          Aktivitas Setoran Terakhir
        </h3>
        {setoran.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <Recycle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada setoran sampah</p>
          </div>
        ) : (
          <div className="space-y-2">
            {setoran.map((s) => {
              const st = STATUS_MAP[s.status] ?? {
                label: s.status,
                cls: "bg-zinc-100 text-zinc-600",
              };
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-3 md:p-4 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      s.jenisSampah === "PLASTIK"
                        ? "bg-red-50 text-red-500"
                        : "bg-orange-50 text-orange-500"
                    }`}>
                    <Recycle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-zinc-900 text-sm">
                        <Tag size={12} className="inline mr-1 text-zinc-400" />
                        {s.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Scale size={11} />
                        {s.beratEstimasi} kg
                        {s.beratAktual != null && (
                          <span className="font-bold text-zinc-700">
                            → {s.beratAktual} kg
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock size={11} />
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {s.status === "SELESAI" && s.totalSaldo != null ? (
                      <p className="font-bold text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle2 size={14} />+{formatRupiah(s.totalSaldo)}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400">{st.label}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
