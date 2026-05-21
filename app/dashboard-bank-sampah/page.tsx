import { Calendar, Clock, Package, Recycle, Scale, Wallet } from "lucide-react";
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

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
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

export default async function BankSampahDashboardPage() {
  const session = await getSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.username;

  // Fetch nasabah linked to this user
  const nasabah = user
    ? await prisma.nasabah.findUnique({
        where: { userId: user.sub },
        select: {
          id: true,
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
              totalHarga: true,
              status: true,
              selesaiAt: true,
              createdAt: true,
            },
          },
          pencairan: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              jumlah: true,
              status: true,
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
  const paperCupKg = setoranSelesai
    .filter((s) => s.jenisSampah === "PAPER_CUP")
    .reduce((a, s) => a + (s.beratAktual ?? s.beratEstimasi), 0);

  // Latest pencairan
  const latestP = nasabah?.pencairan?.[0];

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
      label: "Total Saldo Rupiah",
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
    {
      icon: Wallet,
      label: "Pencairan Terakhir",
      value: latestP ? formatRupiah(latestP.jumlah) : "-",
      sub: latestP
        ? `Status: ${
            latestP.status === "DICAIRKAN"
              ? "Sudah Cair"
              : latestP.status === "DIVERIFIKASI"
                ? "Diverifikasi"
                : latestP.status === "DIAJUKAN"
                  ? "Diajukan"
                  : "Ditolak"
          }`
        : "Belum pernah mengajukan",
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      iconBg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-heading font-bold text-zinc-900">
            Halo, {displayName}! 👋
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Pantau kontribusi lingkungan Anda hari ini.
          </p>
        </div>
        <div className="bg-white p-1.5 px-3 rounded-xl border border-zinc-100 shadow-xs flex items-center gap-1.5 shrink-0 text-zinc-500">
          <Calendar size={14} />
          <span className="text-[10px] font-bold">
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 ${s.bg} transition-all hover:shadow-md`}>
            <div
              className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p
              className={`text-base font-heading font-bold ${s.color} leading-tight truncate`}>
              {s.value}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
              {s.label}
            </p>
            <p className="text-[9px] text-zinc-400 mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 font-heading mb-3">
            Statistik Setoran Anda
          </h3>
          <ConsumerLineChart data={monthlyData} />
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 font-heading mb-3">
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
        <h3 className="text-sm font-bold text-zinc-900 font-heading mb-3">
          Aktivitas Setoran Terakhir
        </h3>
        {setoran.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
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
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      s.jenisSampah === "PLASTIK"
                        ? "bg-red-50 text-red-500"
                        : s.jenisSampah === "KARTON"
                          ? "bg-orange-50 text-orange-500"
                          : "bg-blue-50 text-blue-500"
                    }`}>
                    <Recycle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-bold text-zinc-900 text-xs">
                        {s.jenisSampah === "PLASTIK"
                          ? "Plastik"
                          : s.jenisSampah === "KARTON"
                            ? "Karton"
                            : "Paper Cup"}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${st.cls}`}>
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
                    {s.status === "SELESAI" && s.totalHarga != null ? (
                      <p className="font-bold text-green-600 text-xs flex items-center gap-0.5 justify-end">
                        +{formatRupiah(s.totalHarga)}
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
