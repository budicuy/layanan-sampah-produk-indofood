import { Recycle, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TabunganList from "./components/TabunganList";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function TabunganNasabahPage() {
  // Ambil nasabah beserta setoran dan mutasi
  const nasabahs = await prisma.nasabah.findMany({
    orderBy: { saldo: "desc" },
    include: {
      setorSampah: {
        orderBy: { createdAt: "desc" },
        include: {
          ekpedisi: { select: { alamat: true, noTelp: true } },
        },
      },
      mutasiSaldo: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  const totalSaldoSemua = nasabahs.reduce((a, n) => a + n.saldo, 0);
  const totalSetoranSelesai = nasabahs.reduce(
    (a, n) => a + n.setorSampah.filter((s) => s.status === "SELESAI").length,
    0,
  );
  const nasabahAktif = nasabahs.filter((n) => n.setorSampah.length > 0).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-zinc-900">
          Tabungan Nasabah Konsumen
        </h1>
        <p className="text-zinc-500 mt-1">
          Rekap saldo, total setoran, dan rincian rekening setiap nasabah.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            label: "Nasabah Aktif Setor",
            value: nasabahAktif,
            sub: "Dari total nasabah terdaftar",
            color: "text-blue-600 bg-blue-50",
          },
          {
            icon: Recycle,
            label: "Total Setoran Selesai",
            value: `${totalSetoranSelesai} transaksi`,
            sub: "Seluruh nasabah",
            color: "text-primary bg-red-50",
          },
          {
            icon: Wallet,
            label: "Total Saldo Terkumpul",
            value: formatRupiah(totalSaldoSemua),
            sub: "Total kredit ke nasabah",
            color: "text-green-600 bg-green-50",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div
            key={label}
            className="bg-white rounded-[24px] border border-zinc-100 p-6 shadow-sm">
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

      {/* Daftar Tabel via Client Component */}
      <TabunganList nasabahs={nasabahs} />
    </div>
  );
}
