import { Calendar, Recycle, ShieldCheck, TrendingUp, User } from "lucide-react";
import { headers } from "next/headers";
import {
  WasteLineChart,
  WasteTypeChart,
} from "@/app/dashboard/components/Charts";
import { auth } from "@/lib/auth";

const STATS = [
  {
    icon: Recycle,
    label: "Total Sampah",
    value: "15.2 kg",
    subValue: "+5% dari bulan lalu",
    color: "text-red-600 bg-red-50",
  },
  {
    icon: User,
    label: "Poin Reward",
    value: "450",
    subValue: "Setara Rp 4.500",
    color: "text-zinc-600 bg-zinc-100",
  },
  {
    icon: ShieldCheck,
    label: "Status Akun",
    value: "Konsumen",
    subValue: "Terverifikasi",
    color: "text-primary bg-secondary",
  },
] as const;

export default async function ConsumerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const displayName = user?.name ?? user?.username ?? user?.email;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Halo, {displayName}! 👋
          </h1>
          <p className="text-zinc-500 mt-1">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map(({ icon: Icon, label, value, subValue, color }) => (
          <div
            key={label}
            className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1">
                <TrendingUp size={12} />
                Aktif
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium mb-1">{label}</p>
              <h3 className="text-3xl font-heading font-bold text-zinc-900">
                {value}
              </h3>
              <p className="text-sm text-zinc-400 mt-2">{subValue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-900 font-heading">
              Statistik Setoran Anda
            </h3>
          </div>
          <WasteLineChart />
        </div>

        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 font-heading mb-8">
            Komposisi Sampah Anda
          </h3>
          <WasteTypeChart />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-zinc-900 font-heading mb-6">
          Aktivitas Setoran Terakhir
        </h3>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                <Recycle size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900">
                  Setoran Sampah Plastik
                </h4>
                <p className="text-sm text-zinc-500">
                  Pusat Pengolahan • 2.5 kg
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900">+25 Poin</p>
                <p className="text-xs text-zinc-400">{i} hari yang lalu</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
