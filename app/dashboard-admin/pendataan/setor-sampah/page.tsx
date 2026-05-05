import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageSearch,
  Recycle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import SetorSampahAdminList from "./components/SetorSampahAdminList";

export default async function SetorSampahAdminPage() {
  const [setorSampahList, ekpedisiList] = await Promise.all([
    prisma.setorSampah.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nama: true,
            noTelp: true,
            alamat: true,
            nik: true,
          },
        },
        ekpedisi: {
          select: { noTelp: true, alamat: true },
        },
      },
    }),
    prisma.ekpedisi.findMany({
      select: { id: true, noTelp: true, alamat: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const menunggu = setorSampahList.filter(
    (s) => s.status === "MENUNGGU_VERIFIKASI",
  ).length;
  const proses = setorSampahList.filter((s) =>
    [
      "TERVERIFIKASI",
      "DALAM_PENJEMPUTAN",
      "SUDAH_DISERAHKAN",
      "SAMPAH_DITERIMA",
    ].includes(s.status),
  ).length;
  const selesai = setorSampahList.filter((s) => s.status === "SELESAI").length;
  const ditolak = setorSampahList.filter((s) => s.status === "DITOLAK").length;

  const stats = [
    {
      icon: Clock,
      label: "Menunggu",
      value: menunggu,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      iconBg: "bg-amber-100",
      urgent: menunggu > 0,
    },
    {
      icon: Recycle,
      label: "Dalam Proses",
      value: proses,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      iconBg: "bg-blue-100",
      urgent: false,
    },
    {
      icon: CheckCircle2,
      label: "Selesai",
      value: selesai,
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      iconBg: "bg-green-100",
      urgent: false,
    },
    {
      icon: AlertTriangle,
      label: "Ditolak",
      value: ditolak,
      color: "text-red-600",
      bg: "bg-red-50 border-red-100",
      iconBg: "bg-red-100",
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-900 flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PackageSearch className="text-primary w-5 h-5 md:w-6 md:h-6" />
          </div>
          Setor Sampah
        </h1>
        <p className="text-zinc-500 mt-1 text-sm md:text-base ml-[52px] md:ml-[60px]">
          Kelola dan verifikasi pengajuan setor sampah dari konsumen.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-4 md:p-5 ${s.bg} relative overflow-hidden transition-all hover:shadow-md`}>
            {s.urgent && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
            <div
              className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p
              className={`text-2xl md:text-3xl font-heading font-bold ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      <SetorSampahAdminList
        data={
          setorSampahList as Parameters<typeof SetorSampahAdminList>[0]["data"]
        }
        ekpedisiList={ekpedisiList}
      />
    </div>
  );
}
