"use client";

import {
  Calendar,
  CheckCircle2,
  Coins,
  ExternalLink,
  Gift,
  Info,
  Lock,
  QrCode,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getConsumerPointsAndCoupons, redeemCoupon } from "./actions";

interface KuponData {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  poinCost: number;
  status: "AKTIF" | "DIGUNAKAN" | "EXPIRED";
  createdAt: Date;
  digunakanAt: Date | null;
}

interface TierKuponData {
  id: string;
  tier: string;
  poinMin: number;
  nama: string;
  deskripsi: string;
}

export default function TukarKuponPage() {
  const [points, setPoints] = useState<number>(0);
  const [myCoupons, setMyCoupons] = useState<KuponData[]>([]);
  const [tiers, setTiers] = useState<TierKuponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "my-coupons">(
    "available",
  );
  const [selectedReward, setSelectedReward] = useState<TierKuponData | null>(
    null,
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<KuponData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const data = await getConsumerPointsAndCoupons();
      setPoints(data.poin);
      setMyCoupons(data.kupons as unknown as KuponData[]);
      setTiers(data.tiers as unknown as TierKuponData[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data poin dan kupon");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeemClick = (reward: TierKuponData) => {
    if (points < reward.poinMin) {
      toast.error("Poin Anda tidak mencukupi");
      return;
    }
    setSelectedReward(reward);
    setShowConfirmModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    setSubmitting(selectedReward.id);
    setShowConfirmModal(false);

    try {
      const result = await redeemCoupon(selectedReward.id);
      if (result.success) {
        toast.success(`Berhasil menukarkan kupon Tier: ${selectedReward.nama}`);

        // Fetch coupons again first to update states
        const updated = await getConsumerPointsAndCoupons();
        setPoints(updated.poin);
        const updatedCoupons = updated.kupons as unknown as KuponData[];
        setMyCoupons(updatedCoupons);

        // Find the new coupon in updatedCoupons or prepare fallback
        const found = updatedCoupons.find((c) => c.kode === result.code);
        const fallbackCoupon: KuponData = {
          id: "temp",
          kode: result.code,
          nama: `Kupon Tier ${selectedReward.nama}`,
          deskripsi: selectedReward.deskripsi,
          poinCost: selectedReward.poinMin,
          status: "AKTIF" as const,
          createdAt: new Date(),
          digunakanAt: null,
        };

        if (found) {
          setShowQrModal(found);
        } else {
          setShowQrModal(fallbackCoupon);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setSubmitting(null);
      setSelectedReward(null);
    }
  };

  // Helper to construct validation URL dynamically
  const getValidationUrl = (code: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/kupon-validasi/${code}`;
    }
    return `/kupon-validasi/${code}`;
  };

  const filteredRewards = tiers.filter(
    (reward) =>
      reward.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.tier.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredMyCoupons = myCoupons.filter((c) =>
    c.nama.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "DIAMOND":
        return {
          glow: "from-sky-500/10 to-blue-500/10",
          iconBg: "bg-sky-50 text-sky-600",
          badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
          accentColor: "border-sky-500/20 hover:border-sky-400",
          topBar: "bg-sky-500",
        };
      case "GOLD":
        return {
          glow: "from-amber-500/10 to-orange-500/10",
          iconBg: "bg-amber-50 text-amber-600",
          badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
          accentColor: "border-amber-500/20 hover:border-amber-400",
          topBar: "bg-amber-500",
        };
      default:
        return {
          glow: "from-zinc-500/10 to-zinc-600/10",
          iconBg: "bg-zinc-100 text-zinc-600",
          badgeBg: "bg-zinc-200 text-zinc-800 border-zinc-300",
          accentColor: "border-zinc-500/20 hover:border-zinc-400",
          topBar: "bg-zinc-400",
        };
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header & Poin Card */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 font-heading">
            TUKAR REWARD KUPON
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kumpulkan poin dari setoran sampah Anda dan tukarkan dengan kupon
            reward Tier sesuai kebutuhan Anda.
          </p>
        </div>

        {/* Poin Card Premium */}
        <div className="relative overflow-hidden bg-linear-to-br from-amber-500 via-orange-600 to-red-600 rounded-3xl p-6 shadow-xl shadow-orange-500/20 text-white min-w-[280px] w-full md:w-auto">
          {/* Absolute Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-widest text-amber-200 uppercase">
                TOTAL POIN AKTIF
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-heading tracking-tight">
                  {loading ? "..." : points.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-medium text-orange-200">
                  Poin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-b border-zinc-100 pb-4">
        <div className="flex bg-zinc-100 p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab("available");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "available"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}>
            <Gift className="w-4 h-4" />
            Kupon Tersedia
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("my-coupons");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              activeTab === "my-coupons"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}>
            <Ticket className="w-4 h-4" />
            Kupon Saya
            {myCoupons.filter((c) => c.status === "AKTIF").length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center font-bold">
                  {myCoupons.filter((c) => c.status === "AKTIF").length}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={
              activeTab === "available"
                ? "Cari voucher reward..."
                : "Cari kupon saya..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Memuat data kupon...</p>
        </div>
      ) : activeTab === "available" ? (
        /* GRID KUPON TERSEDIA */
        filteredRewards.length === 0 ? (
          <div className="text-center py-16 bg-white border border-zinc-100 rounded-3xl">
            <Info className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-500">
              Voucher tidak ditemukan
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Belum ada kriteria kupon yang ditambahkan oleh admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const isPointsEnough = points >= reward.poinMin;
              const isRedeemingThis = submitting === reward.id;
              const style = getTierColor(reward.tier);

              return (
                <div
                  key={reward.id}
                  className={`bg-white border rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${style.accentColor}`}>
                  {/* Decorative bar on top */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${style.topBar}`}
                  />

                  {/* Visual Background Glow */}
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${style.glow} rounded-full blur-2xl group-hover:scale-150 transition-all duration-500`}
                  />

                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${style.iconBg}`}>
                        <Ticket className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border ${style.badgeBg}`}>
                        Tier {reward.tier}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-lg text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {reward.nama}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-2 bg-amber-50/50 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100/50 w-max">
                      <Coins className="w-4 h-4" />
                      Cost: {reward.poinMin} Poin
                    </div>

                    <p className="text-xs text-zinc-500 mt-4 leading-relaxed bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 min-h-[90px]">
                      {reward.deskripsi}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-50">
                    <button
                      type="button"
                      disabled={!isPointsEnough || isRedeemingThis}
                      onClick={() => handleRedeemClick(reward)}
                      className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isPointsEnough
                          ? "bg-zinc-950 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-600/20 active:scale-95"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}>
                      {isRedeemingThis ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : isPointsEnough ? (
                        <>
                          <Gift className="w-4 h-4" />
                          Tukarkan Kupon
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Poin Kurang {reward.poinMin - points} Poin
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : /* GRID KUPON SAYA */
      filteredMyCoupons.length === 0 ? (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-3xl">
          <Ticket className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-500">
            Anda belum memiliki kupon
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Kupon yang Anda tukar akan muncul di halaman ini. Silakan tukarkan
            poin Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMyCoupons.map((coupon) => {
            const formattedDate = new Date(coupon.createdAt).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            return (
              <div
                key={coupon.id}
                className={`bg-white border rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
                  coupon.status === "DIGUNAKAN"
                    ? "border-zinc-200 bg-zinc-50/50"
                    : "border-zinc-100"
                }`}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      coupon.status === "AKTIF"
                        ? "bg-green-100 text-green-700"
                        : coupon.status === "DIGUNAKAN"
                          ? "bg-zinc-200 text-zinc-600"
                          : "bg-red-100 text-red-700"
                    }`}>
                    {coupon.status}
                  </span>
                </div>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mb-4">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-black text-lg text-zinc-900">
                    {coupon.nama}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 font-bold">
                    {coupon.kode}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-4">
                    <Calendar className="w-3.5 h-3.5" />
                    Ditukar: {formattedDate}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(coupon)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-50 border border-zinc-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                    <QrCode className="w-4 h-4" />
                    Lihat Detail & QR Code
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM REDEEM MODAL */}
      {showConfirmModal && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-zinc-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Info className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-xl text-zinc-900">
              Konfirmasi Penukaran
            </h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menukarkan{" "}
              <span className="font-bold text-zinc-900">
                {selectedReward.poinMin} poin
              </span>{" "}
              untuk mendapatkan{" "}
              <span className="font-bold text-zinc-900">
                {selectedReward.nama}
              </span>
              ?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="flex-1 py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-orange-600/10 transition-all">
                Ya, Tukarkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR & COUPON DETAIL MODAL (PREMIUM DESIGN) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-zinc-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-orange-500 via-amber-500 to-red-600" />

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="font-heading font-black text-2xl text-zinc-900 tracking-tight">
                KUPON REWARD AKTIF
              </h3>

              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Tunjukkan QR Code ini ke petugas atau merchant untuk
                memverifikasi dan menggunakan reward Anda.
              </p>
            </div>

            {/* Premium Ticket Card UI */}
            <div className="relative mt-6 bg-linear-to-br from-zinc-50 to-zinc-100 border border-zinc-200/60 rounded-3xl p-6 overflow-hidden">
              {/* Ticket Jagged Cuts (Left & Right side circles) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-r border-zinc-200/60 rounded-full -ml-3" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-l border-zinc-200/60 rounded-full -mr-3" />

              {/* QR Code Container */}
              <div className="flex flex-col items-center py-4 border-b border-dashed border-zinc-300">
                <div className="bg-white p-4 rounded-2xl shadow-md border border-zinc-100 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* biome-ignore lint/performance/noImgElement: External dynamic QR API used instead of Next Image to bypass domains whitelist */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      getValidationUrl(showQrModal.kode),
                    )}`}
                    alt="QR Code Kupon"
                    className="w-40 h-40 object-contain"
                  />
                </div>

                <p className="text-[14px] font-mono font-black text-zinc-900 mt-4 tracking-wider bg-white px-4 py-1.5 rounded-full border border-zinc-200">
                  {showQrModal.kode}
                </p>
              </div>

              {/* Reward Details */}
              <div className="pt-5 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Nama Reward
                  </span>
                  <span className="text-sm font-black text-zinc-800 block">
                    {showQrModal.nama}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Biaya Poin
                    </span>
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      {showQrModal.poinCost} Poin
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Status Kupon
                    </span>
                    <span
                      className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        showQrModal.status === "AKTIF"
                          ? "bg-green-100 text-green-700"
                          : showQrModal.status === "DIGUNAKAN"
                            ? "bg-zinc-200 text-zinc-600"
                            : "bg-red-100 text-red-700"
                      }`}>
                      {showQrModal.status}
                    </span>
                  </div>
                </div>

                {showQrModal.deskripsi && (
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Ketentuan & Penjelasan Barang
                    </span>
                    <p className="text-[11px] text-zinc-500 leading-relaxed bg-white/50 p-2.5 rounded-xl border border-zinc-200/50">
                      {showQrModal.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <a
                href={getValidationUrl(showQrModal.kode)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-600/20 transition-all">
                <ExternalLink className="w-4 h-4" />
                Uji Halaman Validasi Kupon
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(null)}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
