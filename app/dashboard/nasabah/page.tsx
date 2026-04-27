import {
  CheckCircle2,
  CreditCard,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  Tag,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import {
  NasabahCategoryChart,
  NasabahStatusChart,
} from "@/app/dashboard/components/NasabahCharts";
import { prisma } from "@/lib/prisma";

export default async function NasabahPage() {
  const nasabahs = await prisma.nasabah.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Data Nasabah Bank
          </h1>
          <p className="text-zinc-500 mt-1">
            Manajemen dan monitoring seluruh nasabah bank sampah.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Nasabah
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 font-heading mb-8">
            Kategori Nasabah
          </h3>
          <div className="h-[300px]">
            <NasabahCategoryChart data={nasabahs} />
          </div>
        </div>
        <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 font-heading mb-8">
            Status Keaktifan
          </h3>
          <div className="h-[300px]">
            <NasabahStatusChart data={nasabahs} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Nasabah
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nasabah..."
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full md:w-64"
              />
            </div>
            <button
              type="button"
              className="p-2 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Nasabah
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak & Alamat
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Rekening
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Lokasi
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {nasabahs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-12 text-center text-zinc-500">
                    Belum ada data nasabah.
                  </td>
                </tr>
              ) : (
                nasabahs.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden relative shrink-0">
                          {n.fotoLokasi ? (
                            <Image
                              src={n.fotoLokasi}
                              alt={n.nama}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{n.nama}</p>
                          <p className="text-xs text-zinc-400 mt-1 font-mono">
                            NIK: {n.nik}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <Phone size={14} className="text-zinc-400" />
                          {n.noTelp}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                          <MapPin size={14} className="text-zinc-400" />
                          <span className="truncate max-w-[200px]">
                            {n.alamat}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                        <Tag size={12} />
                        {n.kategori.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                          <CreditCard size={14} className="text-zinc-400" />
                          {n.noRek}
                        </div>
                        <p className="text-xs text-zinc-400 uppercase">
                          {n.jenisBank}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {n.titikLokasi ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${n.titikLokasi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-bold hover:underline">
                          Lihat Peta
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {n.status === "AKTIF" ? (
                        <div className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs">
                          <CheckCircle2 size={14} />
                          AKTIF
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-zinc-400 font-bold text-xs">
                          <XCircle size={14} />
                          NONAKTIF
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
