"use client";

import {
  Calendar,
  Clock,
  Scale,
  Search,
  Tag,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { useState } from "react";

// ─── Type ────────────────────────────────────────────────────────────────────

export interface LaporanRow {
  id: string;
  nasabahId: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  hargaPerKg: number | null;
  totalSaldo: number | null;
  alamatPenjemputan: string;
  keterangan: string | null;
  selesaiAt: Date | null;
  createdAt: Date;
  nasabah: {
    id: string;
    nama: string;
    nik: string;
    kategori: string;
  };
  ekpedisi: {
    alamat: string;
    noTelp: string;
  } | null;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LaporanTable({ data }: { data: LaporanRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (r) =>
      r.nasabah.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.nasabah.nik.toLowerCase().includes(search.toLowerCase()) ||
      r.jenisSampah.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Search bar */}
      <div className="px-8 py-4 border-b border-zinc-100">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            id="laporan-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama nasabah / NIK / jenis..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/80">
              {[
                "No",
                "Tanggal Selesai",
                "Nasabah",
                "Kategori",
                "Jenis Sampah",
                "Berat",
                "Harga/kg",
                "Total Saldo",
                "Kurir",
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-8 py-14 text-center text-zinc-400 text-sm">
                  Tidak ada data setoran yang ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/50 transition-colors">
                  {/* No */}
                  <td className="px-6 py-5 text-sm text-zinc-400 font-mono">
                    {idx + 1}
                  </td>

                  {/* Tanggal */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm">
                        <Calendar size={11} className="text-zinc-400" />
                        {new Date(
                          row.selesaiAt ?? row.createdAt,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <Clock size={11} />
                        {new Date(
                          row.selesaiAt ?? row.createdAt,
                        ).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </td>

                  {/* Nasabah */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {row.nasabah.nama[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-sm leading-tight">
                          {row.nasabah.nama}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {row.nasabah.nik}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                      {row.nasabah.kategori.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Jenis Sampah */}
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                        row.jenisSampah === "PLASTIK"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                      <Tag size={11} />
                      {row.jenisSampah === "PLASTIK" ? "Plastik" : "Karton"}
                    </span>
                  </td>

                  {/* Berat */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Scale size={13} className="text-zinc-400" />
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">
                          {row.beratAktual ?? row.beratEstimasi} kg
                        </p>
                        {row.beratAktual != null &&
                          row.beratAktual !== row.beratEstimasi && (
                            <p className="text-[10px] text-zinc-400">
                              Est: {row.beratEstimasi} kg
                            </p>
                          )}
                      </div>
                    </div>
                  </td>

                  {/* Harga/kg */}
                  <td className="px-6 py-5">
                    {row.hargaPerKg != null ? (
                      <span className="font-medium text-zinc-700 text-sm">
                        {formatRupiah(row.hargaPerKg)}/kg
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Total Saldo */}
                  <td className="px-6 py-5">
                    {row.totalSaldo != null ? (
                      <div className="flex items-center gap-1.5">
                        <Wallet size={13} className="text-green-600" />
                        <span className="font-bold text-green-700 text-sm">
                          {formatRupiah(row.totalSaldo)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-sm">-</span>
                    )}
                  </td>

                  {/* Kurir */}
                  <td className="px-6 py-5">
                    {row.ekpedisi ? (
                      <div className="flex items-start gap-1.5">
                        <Truck
                          size={13}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-700">
                            {row.ekpedisi.alamat}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {row.ekpedisi.noTelp}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <User size={12} />
                        Langsung
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
