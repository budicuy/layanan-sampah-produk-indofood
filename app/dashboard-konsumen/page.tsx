import {
  CheckCircle2,
  Clock,
  Package,
  Recycle,
  Scale,
  Wallet,
} from "lucide-react";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ConsumerDonutChart,
  ConsumerLineChart,
} from "./components/ConsumerCharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  const session = await getSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username;

  // Fetch nasabah linked to this user
  const nasabah = user
    ? await prisma.nasabah.findUnique({
        where: { userId: user.sub },
        select: {
          poin: true,
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
              totalPoin: true,
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
  const totalPoin = nasabah?.poin ?? 0;
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
  const paperCupKg = setoranSelesai
    .filter((s) => s.jenisSampah === "PAPER_CUP")
    .reduce((a, s) => a + (s.beratAktual ?? s.beratEstimasi), 0);

  // Stats cards
  const stats = [
    {
      icon: Wallet,
      label: "Total Poin",
      value: `${totalPoin} Poin`,
      sub: nasabah ? `Rek: ${nasabah.noRek}` : "Belum terdaftar",
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      iconBg: "bg-green-100",
    },
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
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-heading font-black text-zinc-900 leading-tight">
            Halo, {displayName}! 👋
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Pantau kontribusi lingkungan Anda hari ini.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 ${s.bg} transition-all hover:shadow-xs ${
              idx === 0 ? "col-span-2" : ""
            }`}>
            <div
              className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className={`text-lg font-heading font-black ${s.color}`}>
              {s.value}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
              {s.label}
            </p>
            <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h3 className="text-xs font-bold text-zinc-900 font-heading mb-3">
            Statistik Setoran Anda
          </h3>
          <ConsumerLineChart data={monthlyData} />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h3 className="text-xs font-bold text-zinc-900 font-heading mb-3">
            Komposisi Sampah Anda
          </h3>
          <ConsumerDonutChart
            data={{
              plastik: Math.round(plastikKg * 10) / 10,
              karton: Math.round(kartonKg * 10) / 10,
              paperCup: Math.round(paperCupKg * 10) / 10,
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-900 font-heading mb-3">
          Aktivitas Setoran Terakhir
        </h3>
        {setoran.length === 0 ? (
          <div className="py-10 text-center text-zinc-400">
            <Recycle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Belum ada setoran sampah</p>
          </div>
        ) : (
          <div className="space-y-2">
            {setoran.map((s) => {
              const st = STATUS_MAP[s.status] ?? {
                label: s.status,
                cls: "bg-zinc-100 text-zinc-600",
              };

              let typeLabel = "Plastik";
              let typeCls = "bg-red-50 text-red-500";
              if (s.jenisSampah === "KARTON") {
                typeLabel = "Karton";
                typeCls = "bg-orange-50 text-orange-500";
              } else if (s.jenisSampah === "PAPER_CUP") {
                typeLabel = "Paper Cup";
                typeCls = "bg-blue-50 text-blue-500";
              }

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeCls}`}>
                    <Recycle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-bold text-zinc-900 text-xs">
                        {typeLabel}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Scale size={10} />
                        {s.beratEstimasi} kg
                        {s.beratAktual != null && (
                          <span className="font-bold text-zinc-700">
                            → {s.beratAktual} kg
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-0.5 text-zinc-400">
                        <Clock size={10} />
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {s.status === "SELESAI" && s.totalPoin != null ? (
                      <p className="font-bold text-green-600 text-xs flex items-center gap-0.5">
                        <CheckCircle2 size={12} />+{s.totalPoin} poin
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400">{st.label}</p>
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
