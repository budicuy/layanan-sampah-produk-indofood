"use client";

import {
  CheckCircle2,
  Coins,
  ExternalLink,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getClaimedCouponsData, markCouponAsUsed } from "./actions";

interface CouponDetails {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  poinCost: number;
  status: "AKTIF" | "DIGUNAKAN" | "EXPIRED";
  createdAt: Date;
  updatedAt: Date;
  digunakanAt: Date | null;
  nasabah: {
    id: string;
    nik: string;
    user: {
      name: string;
      username: string;
    };
  };
}

export default function ClaimedCouponsPage() {
  const [coupons, setCoupons] = useState<CouponDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClaimedCouponsData({
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchQuery,
      });
      setCoupons(res.data as unknown as CouponDetails[]);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil daftar kupon");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleMarkAsUsed = async (id: string, code: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menandai kupon dengan kode ${code} sebagai TELAH DIGUNAKAN?`,
      )
    ) {
      return;
    }
    setUpdating(id);
    try {
      const res = await markCouponAsUsed(id);
      if (res.success) {
        toast.success("Kupon berhasil diperbarui!");
        await fetchCoupons();
      } else {
        toast.error(res.error || "Gagal memperbarui kupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 font-heading">
            RIWAYAT KUPON TERKLAIM
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Lihat daftar lengkap penukaran kupon nasabah, verifikasi keaslian,
            dan ubah status penggunaan.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, atau nasabah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {loading && coupons.length === 0 ? (
        <div className="flex justify-center items-center py-20 text-zinc-400">
          <p className="text-sm font-medium">Memuat data kupon...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-3xl">
          <Ticket className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-500">
            Kupon tidak ditemukan
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Belum ada transaksi kupon yang sesuai kriteria pencarian.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Kode Kupon
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Kupon / Voucher
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Nasabah
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Waktu Klaim
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Biaya Poin
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span>Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const claimDate = new Date(
                      coupon.createdAt,
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100/50 whitespace-nowrap">
                            {coupon.kode}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-bold text-zinc-800">
                              {coupon.nama}
                            </p>
                            {coupon.deskripsi && (
                              <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                                {coupon.deskripsi}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-bold uppercase">
                              {coupon.nasabah?.user?.name?.[0] || "N"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-800">
                                {coupon.nasabah?.user?.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                NIK: {coupon.nasabah?.nik}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-zinc-500 font-medium">
                          {claimDate}
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1 w-max border border-amber-100">
                            <Coins className="w-3.5 h-3.5" />
                            {coupon.poinCost}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                coupon.status === "AKTIF"
                                  ? "bg-green-100 text-green-700"
                                  : coupon.status === "DIGUNAKAN"
                                    ? "bg-zinc-200 text-zinc-600"
                                    : "bg-red-100 text-red-700"
                              }`}>
                              {coupon.status}
                            </span>
                            {coupon.status === "DIGUNAKAN" &&
                              coupon.digunakanAt && (
                                <p className="text-[9px] text-zinc-400">
                                  Dipakai:{" "}
                                  {new Date(
                                    coupon.digunakanAt,
                                  ).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/kupon-validasi/${coupon.kode}`}
                              target="_blank"
                              className="p-2 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                              title="Uji Halaman Validasi">
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {coupon.status === "AKTIF" && (
                              <button
                                type="button"
                                disabled={updating === coupon.id}
                                onClick={() =>
                                  handleMarkAsUsed(coupon.id, coupon.kode)
                                }
                                className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-green-600 hover:shadow-sm text-[10px] font-bold rounded-xl transition-all flex items-center gap-1">
                                {updating === coupon.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                Tandai Digunakan
                              </button>
                            )}
                          </div>
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
                <span className="font-bold text-zinc-700">
                  {coupons.length}
                </span>{" "}
                dari <span className="font-bold text-zinc-700">{total}</span>{" "}
                kupon
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
      )}
    </div>
  );
}
