import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Recycle,
  Scale,
  Tag,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TabunganDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const nasabah = await prisma.nasabah.findUnique({
    where: { id },
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

  if (!nasabah) notFound();

  const setoranSelesai = nasabah.setorSampah.filter(
    (s) => s.status === "SELESAI",
  );
  const totalBerat = setoranSelesai.reduce(
    (a, s) => a + (s.beratAktual ?? s.beratEstimasi),
    0,
  );
  const totalDikreditkan = setoranSelesai.reduce(
    (a, s) => a + (s.totalSaldo ?? 0),
    0,
  );

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
    SAMPAH_DITERIMA: {
      label: "Diterima",
      cls: "bg-teal-100 text-teal-700",
    },
    SELESAI: { label: "Selesai ✓", cls: "bg-green-100 text-green-700" },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/nasabah/tabungan"
          id="btn-back-tabungan"
          className="mt-1 p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            {nasabah.nama}
          </h1>
          <p className="text-zinc-500 mt-1">
            Detail tabungan & riwayat setoran sampah
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil nasabah */}
        <div className="bg-white rounded-[28px] border border-zinc-100 p-6 shadow-sm space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
              {nasabah.nama[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-heading font-bold text-zinc-900 text-lg leading-tight">
                {nasabah.nama}
              </p>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">
                {nasabah.kategori.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-zinc-600">
              <User size={15} className="text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  NIK / No. Nasabah
                </p>
                <p className="font-mono font-bold text-zinc-800 mt-0.5">
                  {nasabah.nik}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-zinc-600">
              <Phone size={15} className="text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  No. Telp
                </p>
                <p className="font-bold text-zinc-800 mt-0.5">
                  {nasabah.noTelp}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-zinc-600">
              <MapPin size={15} className="text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  Alamat
                </p>
                <p className="text-zinc-800 mt-0.5 leading-snug">
                  {nasabah.alamat}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-zinc-600">
              <CreditCard size={15} className="text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  Rekening
                </p>
                <p className="font-bold text-zinc-800 mt-0.5">
                  {nasabah.noRek}
                </p>
                <p className="text-[10px] text-zinc-400">{nasabah.jenisBank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan saldo & setoran */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Saldo */}
          <div className="col-span-2 bg-primary rounded-[24px] p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20">
            <div className="relative z-10">
              <p className="text-white/70 text-sm font-medium">
                Saldo Tabungan
              </p>
              <p className="text-4xl font-heading font-bold mt-2">
                {formatRupiah(nasabah.saldo)}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Rek: {nasabah.noRek} · {nasabah.jenisBank}
              </p>
            </div>
            <Wallet
              size={64}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10"
            />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>

          {[
            {
              icon: CheckCircle2,
              label: "Setoran Selesai",
              value: setoranSelesai.length,
              sub: "transaksi",
              color: "text-green-600 bg-green-50",
            },
            {
              icon: Scale,
              label: "Total Berat",
              value: `${totalBerat.toFixed(1)} kg`,
              sub: "berat aktual",
              color: "text-blue-600 bg-blue-50",
            },
            {
              icon: Recycle,
              label: "Total Semua Status",
              value: nasabah.setorSampah.length,
              sub: "termasuk proses",
              color: "text-purple-600 bg-purple-50",
            },
            {
              icon: Wallet,
              label: "Total Dikreditkan",
              value: formatRupiah(totalDikreditkan),
              sub: "semua waktu",
              color: "text-primary bg-red-50",
            },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div
              key={label}
              className="bg-white rounded-[20px] border border-zinc-100 p-5 shadow-sm">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={17} />
              </div>
              <p className="text-xl font-heading font-bold text-zinc-900 leading-tight">
                {value}
              </p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {label}
              </p>
              <p className="text-[10px] text-zinc-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat setoran sampah */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100">
          <h2 className="text-xl font-heading font-bold text-zinc-900">
            Riwayat Setoran Sampah
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Semua pengajuan setoran dari nasabah ini
          </p>
        </div>

        {nasabah.setorSampah.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <Recycle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada setoran sampah</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80">
                  {[
                    "Tanggal",
                    "Jenis",
                    "Berat Estimasi",
                    "Berat Aktual",
                    "Harga/kg",
                    "Saldo Kredit",
                    "Kurir",
                    "Status",
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
                {nasabah.setorSampah.map((s) => {
                  const st = STATUS_MAP[s.status] ?? {
                    label: s.status,
                    cls: "bg-zinc-100 text-zinc-600",
                  };
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-zinc-50/50 transition-colors">
                      {/* Tanggal */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm">
                            <Calendar size={11} className="text-zinc-400" />
                            {formatDate(s.createdAt)}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                            <Clock size={11} />
                            {new Date(s.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Jenis */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                            s.jenisSampah === "PLASTIK"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                          <Tag size={11} />
                          {s.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"}
                        </span>
                      </td>

                      {/* Berat estimasi */}
                      <td className="px-6 py-5 text-sm text-zinc-600 font-medium">
                        {s.beratEstimasi} kg
                      </td>

                      {/* Berat aktual */}
                      <td className="px-6 py-5">
                        {s.beratAktual != null ? (
                          <span className="font-bold text-zinc-900 text-sm">
                            {s.beratAktual} kg
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Harga/kg */}
                      <td className="px-6 py-5">
                        {s.hargaPerKg != null ? (
                          <span className="text-sm text-zinc-700 font-medium">
                            {formatRupiah(s.hargaPerKg)}/kg
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Saldo kredit */}
                      <td className="px-6 py-5">
                        {s.totalSaldo != null ? (
                          <div className="flex items-center gap-1.5">
                            <Wallet size={13} className="text-green-600" />
                            <span className="font-bold text-green-700 text-sm">
                              {formatRupiah(s.totalSaldo)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Kurir */}
                      <td className="px-6 py-5">
                        {s.ekpedisi ? (
                          <div className="flex items-start gap-1.5">
                            <Truck
                              size={13}
                              className="text-zinc-400 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-zinc-700 leading-tight">
                                {s.ekpedisi.alamat}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {s.ekpedisi.noTelp}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs flex items-center gap-1">
                            <User size={12} />-
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Riwayat mutasi saldo */}
      {nasabah.mutasiSaldo.length > 0 && (
        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-heading font-bold text-zinc-900">
              Riwayat Mutasi Saldo
            </h2>
            <p className="text-xs text-zinc-400 mt-1">20 transaksi terakhir</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {nasabah.mutasiSaldo.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-8 py-4 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      m.jumlah >= 0
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                    <Wallet size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">
                      {m.keterangan}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ${
                    m.jumlah >= 0 ? "text-green-700" : "text-red-600"
                  }`}>
                  {m.jumlah >= 0 ? "+" : ""}
                  {formatRupiah(m.jumlah)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
