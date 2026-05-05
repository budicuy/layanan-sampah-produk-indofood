import { ArrowRight, Recycle, Scale, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function TabunganNasabahPage() {
  // Ambil nasabah beserta setoran yang sudah selesai
  const nasabahs = await prisma.nasabah.findMany({
    orderBy: { saldo: "desc" },
    select: {
      id: true,
      nama: true,
      kategori: true,
      nik: true,
      noRek: true,
      jenisBank: true,
      saldo: true,
      setorSampah: {
        where: { status: "SELESAI" },
        select: {
          id: true,
          jenisSampah: true,
          beratAktual: true,
          beratEstimasi: true,
          totalSaldo: true,
          selesaiAt: true,
        },
      },
    },
  });

  // Hanya tampilkan nasabah yang pernah setor (atau semua — sesuai kebutuhan)
  // Saat ini tampilkan semua nasabah aktif
  const totalSaldoSemua = nasabahs.reduce((a, n) => a + n.saldo, 0);
  const totalSetoranSelesai = nasabahs.reduce(
    (a, n) => a + n.setorSampah.length,
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

      {/* Tabel nasabah */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100">
          <h2 className="text-xl font-heading font-bold text-zinc-900">
            Daftar Nasabah & Tabungan
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Klik tombol Detail untuk melihat riwayat setoran per nasabah
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "No",
                  "Nasabah",
                  "NIK / No. Nasabah",
                  "Rekening",
                  "Total Setoran",
                  "Total Berat",
                  "Saldo",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {nasabahs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-8 py-14 text-center text-zinc-400 text-sm">
                    Belum ada nasabah terdaftar.
                  </td>
                </tr>
              ) : (
                nasabahs.map((nasabah, idx) => {
                  const totalSetoran = nasabah.setorSampah.length;
                  const totalBerat = nasabah.setorSampah.reduce(
                    (a, s) => a + (s.beratAktual ?? s.beratEstimasi),
                    0,
                  );

                  return (
                    <tr
                      key={nasabah.id}
                      className="hover:bg-zinc-50/50 transition-colors">
                      {/* No */}
                      <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Nasabah */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {nasabah.nama[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-sm leading-tight">
                              {nasabah.nama}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {nasabah.kategori.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td className="px-6 py-5">
                        <span className="font-mono text-sm text-zinc-700">
                          {nasabah.nik}
                        </span>
                      </td>

                      {/* Rekening */}
                      <td className="px-6 py-5">
                        <p className="font-bold text-zinc-900 text-sm">
                          {nasabah.noRek}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {nasabah.jenisBank}
                        </p>
                      </td>

                      {/* Total Setoran */}
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            totalSetoran > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}>
                          {totalSetoran} transaksi
                        </span>
                      </td>

                      {/* Total Berat */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <Scale size={13} className="text-zinc-400" />
                          <span className="font-medium text-zinc-700 text-sm">
                            {totalBerat.toFixed(1)} kg
                          </span>
                        </div>
                      </td>

                      {/* Saldo */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={13} className="text-green-600" />
                          <span
                            className={`font-bold text-sm ${
                              nasabah.saldo > 0
                                ? "text-green-700"
                                : "text-zinc-400"
                            }`}>
                            {formatRupiah(nasabah.saldo)}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-5">
                        <Link
                          href={`/dashboard/nasabah/tabungan/${nasabah.id}`}
                          id={`btn-detail-${nasabah.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20">
                          Detail
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
