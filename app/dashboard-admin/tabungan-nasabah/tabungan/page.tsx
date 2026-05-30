"use client";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Recycle,
  Scale,
  Search,
  Tag,
  Truck,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getTabunganData } from "@/app/dashboard-admin/tabungan-nasabah/tabungan/actions";

// ─── Types ──────────────────────────────────────────────────────────────────

// We define the type structure based on what getTabunganData returns.
type SetorSampah = {
  id: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  poinPerKg: number | null;
  totalPoin: number | null;
  hargaPerKg: number | null;
  totalHarga: number | null;
  status: string;
  createdAt: Date;
  ekpedisi: { alamat: string; noTelp: string } | null;
};

type MutasiSaldo = {
  id: string;
  jumlah: number;
  keterangan: string;
  createdAt: Date;
};

type NasabahWithTabungan = {
  id: string;
  user: { name: string; role: string };
  nik: string;
  kategori: string;
  noRek: string;
  jenisBank: string;
  noTelp: string;
  alamat: string;
  poin: number;
  saldo: number;
  setorSampah: SetorSampah[];
  mutasiSaldo: MutasiSaldo[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  SAMPAH_DITERIMA: {
    label: "Diterima",
    cls: "bg-teal-100 text-teal-700",
  },
  SELESAI: { label: "Selesai ✓", cls: "bg-green-100 text-green-700" },
};

export default function TabunganNasabahPage() {
  const [nasabahs, setNasabahs] = useState<NasabahWithTabungan[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalPoin: 0,
    totalSaldo: 0,
    totalSetoranSelesai: 0,
    nasabahAktif: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNasabah, setSelectedNasabah] =
    useState<NasabahWithTabungan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    setIsLoading(true);
    getTabunganData({
      page: currentPage,
      pageSize,
      searchTerm,
      filterKategori,
    }).then((res) => {
      const result = res as {
        data: NasabahWithTabungan[];
        total: number;
        stats: {
          totalPoin: number;
          totalSaldo: number;
          totalSetoranSelesai: number;
          nasabahAktif: number;
        };
      };
      setNasabahs(result.data);
      setTotal(result.total);
      setStats(result.stats);
      setIsLoading(false);
    });
  }, [currentPage, pageSize, searchTerm, filterKategori]);

  const totalPoinSemua = stats.totalPoin;
  const totalSaldoSemua = stats.totalSaldo;
  const totalSetoranSelesai = stats.totalSetoranSelesai;
  const nasabahAktif = stats.nasabahAktif;

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleKategoriChange = (val: string) => {
    setFilterKategori(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-zinc-900">
          Tabungan Nasabah Konsumen
        </h1>
        <p className="text-zinc-500 mt-1">
          Rekap poin, total setoran, dan rincian rekening setiap nasabah.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            label: "Total Poin Terkumpul",
            value: `${totalPoinSemua} Poin`,
            sub: "Total poin diberikan",
            color: "text-green-600 bg-green-50",
          },
          {
            icon: CreditCard,
            label: "Total Kredit Bank Sampah",
            value: `Rp ${totalSaldoSemua.toLocaleString("id-ID")}`,
            sub: "Total uang ditarik nasabah",
            color: "text-amber-600 bg-amber-50",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div
            key={label}
            className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
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
      <div className="bg-white rounded-4xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-zinc-900">
              Daftar Nasabah & Tabungan
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Klik tombol Detail untuk melihat riwayat setoran per nasabah
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nasabah..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full lg:w-64"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => handleKategoriChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              <option value="PERORANGAN">Perorangan</option>
              <option value="BANK_SAMPAH">SICUAN</option>
              <option value="WARMIENDO">Warmiendo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "No",
                  "Nasabah",
                  "NIK / No. Nasabah",
                  "Rekening",
                  "Total Setoran",
                  "Total Berat",
                  "Poin",
                  "Kredit",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 md:px-8 py-12 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : nasabahs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 md:px-8 py-14 text-center text-zinc-400 text-sm">
                    Belum ada nasabah terdaftar.
                  </td>
                </tr>
              ) : (
                nasabahs.map((nasabah, idx) => {
                  const totalSetoran = nasabah.setorSampah.length;
                  const totalBerat = nasabah.setorSampah.reduce(
                    (a: number, s: SetorSampah) =>
                      a + (s.beratAktual ?? s.beratEstimasi),
                    0,
                  );
                  const isBankSampah =
                    nasabah.user?.role === "BANK_SAMPAH" ||
                    nasabah.kategori === "BANK_SAMPAH";

                  return (
                    <tr
                      key={nasabah.id}
                      className="hover:bg-zinc-50/50 transition-colors">
                      {/* No */}
                      <td className="px-4 md:px-8 py-4 md:py-5 text-sm text-zinc-400 font-mono whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Nasabah */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {nasabah.user?.name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 text-[13px] md:text-sm leading-tight truncate max-w-30 md:max-w-none">
                              {nasabah.user?.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-30 md:max-w-none">
                              {nasabah.kategori.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* NIK */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <span className="font-mono text-[13px] md:text-sm text-zinc-700 whitespace-nowrap">
                          {nasabah.nik}
                        </span>
                      </td>

                      {/* Rekening */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <p className="font-bold text-zinc-900 text-[13px] md:text-sm whitespace-nowrap">
                          {nasabah.noRek}
                        </p>
                        <p className="text-[10px] text-zinc-400 whitespace-nowrap">
                          {nasabah.jenisBank}
                        </p>
                      </td>

                      {/* Total Setoran */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap ${
                            totalSetoran > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}>
                          {totalSetoran} transaksi
                        </span>
                      </td>

                      {/* Total Berat */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Scale size={13} className="text-zinc-400 shrink-0" />
                          <span className="font-medium text-zinc-700 text-[13px] md:text-sm">
                            {totalBerat.toFixed(1)} kg
                          </span>
                        </div>
                      </td>

                      {/* Poin */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Wallet
                            size={13}
                            className="text-green-600 shrink-0"
                          />
                          <span
                            className={`font-bold text-[13px] md:text-sm ${
                              !isBankSampah && nasabah.poin > 0
                                ? "text-green-700"
                                : "text-zinc-400"
                            }`}>
                            {isBankSampah ? "-" : `${nasabah.poin} poin`}
                          </span>
                        </div>
                      </td>

                      {/* Kredit */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <CreditCard
                            size={13}
                            className="text-amber-600 shrink-0"
                          />
                          <span
                            className={`font-bold text-[13px] md:text-sm ${
                              isBankSampah && nasabah.saldo > 0
                                ? "text-amber-700"
                                : "text-zinc-400"
                            }`}>
                            {isBankSampah
                              ? `Rp ${nasabah.saldo.toLocaleString("id-ID")}`
                              : "-"}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <button
                          type="button"
                          onClick={() => setSelectedNasabah(nasabah)}
                          className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-xl text-[10px] md:text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20 whitespace-nowrap">
                          Detail
                          <ArrowRight size={12} className="shrink-0" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-5 md:p-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/30">
            <p className="text-sm text-zinc-500">
              Menampilkan{" "}
              <span className="font-bold text-zinc-700">{nasabahs.length}</span>{" "}
              dari <span className="font-bold text-zinc-700">{total}</span>{" "}
              nasabah
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}>
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selectedNasabah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 md:px-8 md:py-6 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {selectedNasabah.user?.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-heading font-bold text-zinc-900">
                    {selectedNasabah.user?.name}
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-500">
                    Detail tabungan & riwayat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNasabah(null)}
                className="p-2 md:p-3 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 overflow-y-auto w-full max-w-full overflow-x-hidden">
              <div className="space-y-8">
                {/* Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profil nasabah */}
                  <div className="bg-white rounded-[28px] border border-zinc-100 p-6 shadow-sm space-y-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3 text-zinc-600">
                        <User
                          size={15}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                            NIK / No. Nasabah
                          </p>
                          <p className="font-mono font-bold text-zinc-800 mt-0.5 truncate">
                            {selectedNasabah.nik}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-zinc-600">
                        <Phone
                          size={15}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                            No. Telp
                          </p>
                          <p className="font-bold text-zinc-800 mt-0.5 truncate">
                            {selectedNasabah.noTelp}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-zinc-600">
                        <MapPin
                          size={15}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                            Alamat
                          </p>
                          <p className="text-zinc-800 mt-0.5 leading-snug wrap-break-word">
                            {selectedNasabah.alamat}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-zinc-600">
                        <CreditCard
                          size={15}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                            Rekening
                          </p>
                          <p className="font-bold text-zinc-800 mt-0.5 truncate">
                            {selectedNasabah.noRek}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {selectedNasabah.jenisBank}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan poin & setoran */}
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    {/* Poin / Saldo */}
                    <div className="col-span-2 bg-primary rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                      <div className="relative z-10">
                        <p className="text-white/70 text-sm font-medium">
                          {selectedNasabah.kategori === "BANK_SAMPAH"
                            ? "Total Kredit Uang"
                            : "Total Poin"}
                        </p>
                        <p className="text-3xl md:text-4xl font-heading font-bold mt-2">
                          {selectedNasabah.kategori === "BANK_SAMPAH"
                            ? `Rp ${selectedNasabah.saldo.toLocaleString("id-ID")}`
                            : `${selectedNasabah.poin} poin`}
                        </p>
                      </div>
                      {selectedNasabah.kategori === "BANK_SAMPAH" ? (
                        <CreditCard
                          size={64}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10"
                        />
                      ) : (
                        <Wallet
                          size={64}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10"
                        />
                      )}
                      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>

                    {[
                      {
                        icon: CheckCircle2,
                        label: "Setoran Selesai",
                        value: selectedNasabah.setorSampah.filter(
                          (s: SetorSampah) => s.status === "SELESAI",
                        ).length,
                        sub: "transaksi",
                        color: "text-green-600 bg-green-50",
                      },
                      {
                        icon: Scale,
                        label: "Total Berat",
                        value: `${selectedNasabah.setorSampah
                          .filter((s: SetorSampah) => s.status === "SELESAI")
                          .reduce(
                            (a: number, s: SetorSampah) =>
                              a + (s.beratAktual ?? s.beratEstimasi),
                            0,
                          )
                          .toFixed(1)} kg`,
                        sub: "berat aktual",
                        color: "text-blue-600 bg-blue-50",
                      },
                      {
                        icon: Recycle,
                        label: "Total Semua Status",
                        value: selectedNasabah.setorSampah.length,
                        sub: "termasuk proses",
                        color: "text-purple-600 bg-purple-50",
                      },
                      {
                        icon:
                          selectedNasabah.kategori === "BANK_SAMPAH"
                            ? CreditCard
                            : Wallet,
                        label:
                          selectedNasabah.kategori === "BANK_SAMPAH"
                            ? "Total Kredit Diberikan"
                            : "Total Poin Diberikan",
                        value:
                          selectedNasabah.kategori === "BANK_SAMPAH"
                            ? `Rp ${selectedNasabah.setorSampah
                                .filter(
                                  (s: SetorSampah) => s.status === "SELESAI",
                                )
                                .reduce(
                                  (a: number, s: SetorSampah) =>
                                    a + (s.totalHarga ?? 0),
                                  0,
                                )
                                .toLocaleString("id-ID")}`
                            : `${selectedNasabah.setorSampah
                                .filter(
                                  (s: SetorSampah) => s.status === "SELESAI",
                                )
                                .reduce(
                                  (a: number, s: SetorSampah) =>
                                    a + (s.totalPoin ?? 0),
                                  0,
                                )} poin`,
                        sub: "semua waktu",
                        color: "text-primary bg-red-50",
                      },
                    ].map(({ icon: Icon, label, value, sub, color }) => (
                      <div
                        key={label}
                        className="bg-white rounded-[20px] border border-zinc-100 p-4 md:p-5 shadow-sm">
                        <div
                          className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                          <Icon size={17} />
                        </div>
                        <p className="text-lg md:text-xl font-heading font-bold text-zinc-900 leading-tight">
                          {value}
                        </p>
                        <p className="text-[10px] md:text-xs text-zinc-500 font-medium mt-0.5">
                          {label}
                        </p>
                        <p className="text-[10px] text-zinc-400 hidden md:block">
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Riwayat setoran sampah */}
                <div className="bg-white rounded-4xl border border-zinc-100 shadow-sm overflow-hidden">
                  <div className="p-5 md:p-8 border-b border-zinc-100">
                    <h3 className="text-lg md:text-xl font-heading font-bold text-zinc-900">
                      Riwayat Setoran Sampah
                    </h3>
                  </div>

                  {selectedNasabah.setorSampah.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400">
                      <Recycle size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Belum ada setoran sampah</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                          <tr className="bg-zinc-50/80">
                            {[
                              "Tanggal",
                              "Jenis",
                              "Berat Estimasi",
                              "Berat Aktual",
                              selectedNasabah.kategori === "BANK_SAMPAH"
                                ? "Harga/kg"
                                : "Poin/kg",
                              selectedNasabah.kategori === "BANK_SAMPAH"
                                ? "Kredit Uang"
                                : "Poin Kredit",
                              "Kurir",
                              "Status",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {selectedNasabah.setorSampah.map((s: SetorSampah) => {
                            const st = STATUS_MAP[s.status] ?? {
                              label: s.status,
                              cls: "bg-zinc-100 text-zinc-600",
                            };
                            return (
                              <tr
                                key={s.id}
                                className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  <div className="flex flex-col gap-0.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-[13px] md:text-sm">
                                      <Calendar
                                        size={11}
                                        className="text-zinc-400 shrink-0"
                                      />
                                      {formatDate(s.createdAt)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] md:text-xs">
                                      <Clock size={11} className="shrink-0" />
                                      {new Date(s.createdAt).toLocaleTimeString(
                                        "id-ID",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap ${
                                      s.jenisSampah === "PLASTIK"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}>
                                    <Tag size={11} className="shrink-0" />
                                    {s.jenisSampah === "PLASTIK"
                                      ? "Plastik"
                                      : "Karton"}
                                  </span>
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5 text-[13px] md:text-sm text-zinc-600 font-medium whitespace-nowrap">
                                  {s.beratEstimasi} kg
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  {s.beratAktual != null ? (
                                    <span className="font-bold text-zinc-900 text-[13px] md:text-sm whitespace-nowrap">
                                      {s.beratAktual} kg
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-sm whitespace-nowrap">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  {selectedNasabah.kategori ===
                                  "BANK_SAMPAH" ? (
                                    s.hargaPerKg != null ? (
                                      <span className="text-[13px] md:text-sm text-zinc-700 font-medium whitespace-nowrap">
                                        Rp{" "}
                                        {s.hargaPerKg.toLocaleString("id-ID")}
                                        /kg
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400 text-sm whitespace-nowrap">
                                        -
                                      </span>
                                    )
                                  ) : s.poinPerKg != null ? (
                                    <span className="text-[13px] md:text-sm text-zinc-700 font-medium whitespace-nowrap">
                                      {s.poinPerKg} poin/kg
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 text-sm whitespace-nowrap">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  {selectedNasabah.kategori ===
                                  "BANK_SAMPAH" ? (
                                    s.totalHarga != null ? (
                                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                                        <CreditCard
                                          size={13}
                                          className="text-amber-600 shrink-0"
                                        />
                                        <span className="font-bold text-amber-700 text-[13px] md:text-sm">
                                          Rp{" "}
                                          {s.totalHarga.toLocaleString("id-ID")}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-zinc-400 text-sm whitespace-nowrap">
                                        -
                                      </span>
                                    )
                                  ) : s.totalPoin != null ? (
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <Wallet
                                        size={13}
                                        className="text-green-600 shrink-0"
                                      />
                                      <span className="font-bold text-green-700 text-[13px] md:text-sm">
                                        {`${s.totalPoin} poin`}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 text-sm whitespace-nowrap">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  {s.ekpedisi ? (
                                    <div className="flex items-start gap-1.5 min-w-30">
                                      <Truck
                                        size={13}
                                        className="text-zinc-400 mt-0.5 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-[10px] md:text-xs font-bold text-zinc-700 leading-tight truncate">
                                          {s.ekpedisi.alamat}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 truncate">
                                          {s.ekpedisi.noTelp}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 text-[10px] md:text-xs flex items-center gap-1 whitespace-nowrap">
                                      <User size={12} className="shrink-0" />-
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 md:px-6 py-4 md:py-5">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap ${st.cls}`}>
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

                {/* Riwayat mutasi poin / saldo */}
                {selectedNasabah.mutasiSaldo.length > 0 && (
                  <div className="bg-white rounded-4xl border border-zinc-100 shadow-sm overflow-hidden">
                    <div className="p-5 md:p-8 border-b border-zinc-100">
                      <h3 className="text-lg md:text-xl font-heading font-bold text-zinc-900">
                        {selectedNasabah.kategori === "BANK_SAMPAH"
                          ? "Riwayat Mutasi Uang"
                          : "Riwayat Mutasi Poin"}
                      </h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {selectedNasabah.mutasiSaldo.map((m: MutasiSaldo) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-5 py-4 md:px-8 hover:bg-zinc-50/50 transition-colors gap-4">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div
                              className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                m.jumlah >= 0
                                  ? selectedNasabah.kategori === "BANK_SAMPAH"
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}>
                              {selectedNasabah.kategori === "BANK_SAMPAH" ? (
                                <CreditCard size={16} />
                              ) : (
                                <Wallet size={16} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-900 text-[13px] md:text-sm truncate">
                                {m.keterangan}
                              </p>
                              <p className="text-[10px] md:text-xs text-zinc-400 truncate">
                                {formatDateTime(m.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold text-[13px] md:text-sm shrink-0 whitespace-nowrap ${
                              m.jumlah >= 0
                                ? selectedNasabah.kategori === "BANK_SAMPAH"
                                  ? "text-amber-700"
                                  : "text-green-700"
                                : "text-red-600"
                            }`}>
                            {m.jumlah >= 0 ? "+" : ""}
                            {selectedNasabah.kategori === "BANK_SAMPAH"
                              ? `Rp ${m.jumlah.toLocaleString("id-ID")}`
                              : `${m.jumlah} poin`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
