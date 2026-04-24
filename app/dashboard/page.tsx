"use client";

import {
  ChevronRight,
  Clock,
  Coins,
  MapPin,
  MoreVertical,
  Plus,
  Recycle,
  Trash2,
  TrendingUp,
  Truck,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      label: "Total Sampah",
      value: "24.5 kg",
      icon: <Trash2 size={20} />,
      trend: "+12%",
      color: "primary",
    },
    {
      label: "Poin Terkumpul",
      value: "1,250",
      icon: <Coins size={20} />,
      trend: "+250",
      color: "amber-500",
    },
    {
      label: "Daur Ulang",
      value: "85%",
      icon: <Recycle size={20} />,
      trend: "+5%",
      color: "green-500",
    },
    {
      label: "Sisa Jemput",
      value: "2 Kali",
      icon: <Truck size={20} />,
      trend: "Bulan ini",
      color: "blue-500",
    },
  ];

  const recentPickups = [
    {
      id: "PJ-001",
      date: "24 Apr 2026",
      type: "Organik & Anorganik",
      weight: "3.2 kg",
      status: "Selesai",
    },
    {
      id: "PJ-002",
      date: "21 Apr 2026",
      type: "Anorganik",
      weight: "1.5 kg",
      status: "Selesai",
    },
    {
      id: "PJ-003",
      date: "18 Apr 2026",
      type: "Organik & Anorganik",
      weight: "4.1 kg",
      status: "Selesai",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Halo, Budicuy! 👋
          </h1>
          <p className="text-zinc-400 max-w-md">
            Anda telah membantu menyelamatkan{" "}
            <span className="text-white font-bold">12 kg</span> sampah bulan
            ini. Teruslah berkontribusi untuk lingkungan!
          </p>
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent transition-all"
            >
              <Plus size={18} />
              Jadwalkan Jemput
            </button>
            <button
              type="button"
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Lihat Laporan
            </button>
          </div>
        </div>
        <div className="relative z-10 hidden lg:block">
          <div className="w-48 h-48 bg-primary/10 rounded-full border-8 border-primary/20 flex items-center justify-center animate-pulse">
            <Recycle className="text-primary w-20 h-20" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-[24px] border border-zinc-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-xl bg-zinc-50 text-zinc-900 group-hover:bg-primary group-hover:text-white transition-all`}
              >
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} />
                {stat.trend}
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Chart Mockup */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 font-heading">
                Statistik Mingguan
              </h3>
              <p className="text-sm text-zinc-500">
                Volume sampah yang terkumpul
              </p>
            </div>
            <select className="bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold p-2 outline-none">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>

          {/* Custom Chart Mockup */}
          <div className="h-64 flex items-end justify-between gap-2 pt-4">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, i) => {
              const heights = [40, 65, 45, 90, 55, 75, 60];
              const h = heights[i];
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div
                    className="w-full bg-zinc-100 rounded-t-xl relative group-hover:bg-primary transition-all duration-500"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}kg
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Pickup Card */}
        <div className="bg-primary p-8 rounded-[32px] text-white flex flex-col justify-between shadow-xl shadow-primary/30 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl font-heading">
                Jadwal Terdekat
              </h3>
              <Clock className="text-white/60" size={20} />
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-1">
                  Kapan
                </p>
                <p className="text-lg font-bold">Besok, 25 April</p>
                <p className="text-sm text-white/80">09:00 - 11:00 WIB</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-1">
                  Lokasi
                </p>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-white/60 shrink-0" />
                  <p className="text-sm font-medium line-clamp-1">
                    Jl. Kemuning No. 12, Jakarta
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-white text-primary font-bold py-4 rounded-2xl mt-8 hover:bg-zinc-100 transition-all"
          >
            Kelola Jadwal
          </button>
        </div>
      </div>

      {/* Recent Pickups Table */}
      <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Aktivitas Terakhir
          </h3>
          <button
            type="button"
            className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
          >
            Lihat Semua
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  ID Jemput
                </th>
                <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Tanggal
                </th>
                <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Jenis Sampah
                </th>
                <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat
                </th>
                <th className="pb-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {recentPickups.map((pickup) => (
                <tr
                  key={pickup.id}
                  className="group hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="py-6 font-bold text-zinc-900 text-sm">
                    {pickup.id}
                  </td>
                  <td className="py-6 text-zinc-600 text-sm">{pickup.date}</td>
                  <td className="py-6">
                    <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-1 rounded-full">
                      {pickup.type}
                    </span>
                  </td>
                  <td className="py-6 font-bold text-zinc-900 text-sm">
                    {pickup.weight}
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-bold text-zinc-900">
                        {pickup.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 text-right">
                    <button
                      type="button"
                      className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
