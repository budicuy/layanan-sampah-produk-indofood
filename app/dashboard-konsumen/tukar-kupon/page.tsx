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
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header & Poin Card */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
            TUKAR REWARD KUPON
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Kumpulkan poin dari setoran sampah Anda dan tukarkan dengan kupon
            reward Tier sesuai kebutuhan Anda.
          </p>
        </div>

        {/* Poin Card Premium */}
        <div className="relative overflow-hidden bg-linear-to-br from-amber-500 via-orange-600 to-red-600 rounded-2xl p-4.5 shadow-md text-white w-full">
          {/* Absolute Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-6 -mt-6" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200 shrink-0">
              <Coins className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-widest text-amber-200 uppercase">
                TOTAL POIN AKTIF
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-heading tracking-tight leading-none">
                  {loading ? "..." : points.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-medium text-orange-200">
                  Poin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu & Search */}
      <div className="flex flex-col gap-3 pb-3 border-b border-zinc-100/80">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab("available");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "available"
                ? "bg-white text-zinc-950 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}>
            <Gift className="w-3.5 h-3.5" />
            Kupon Tersedia
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("my-coupons");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === "my-coupons"
                ? "bg-white text-zinc-950 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}>
            <Ticket className="w-3.5 h-3.5" />
            Kupon Saya
            {myCoupons.filter((c) => c.status === "AKTIF").length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] text-white items-center justify-center font-bold">
                  {myCoupons.filter((c) => c.status === "AKTIF").length}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={
              activeTab === "available"
                ? "Cari voucher reward..."
                : "Cari kupon saya..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <p className="text-xs font-bold">Memuat data kupon...</p>
        </div>
      ) : activeTab === "available" ? (
        /* GRID KUPON TERSEDIA */
        filteredRewards.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-100 rounded-2xl">
            <Info className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-500">
              Voucher tidak ditemukan
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Belum ada kriteria kupon yang ditambahkan oleh admin.
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {filteredRewards.map((reward) => {
              const isPointsEnough = points >= reward.poinMin;
              const isRedeemingThis = submitting === reward.id;
              const style = getTierColor(reward.tier);

              return (
                <div
                  key={reward.id}
                  className={`bg-white border rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all duration-300 relative overflow-hidden group ${style.accentColor}`}>
                  {/* Decorative bar on top */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${style.topBar}`}
                  />

                  {/* Visual Background Glow */}
                  <div
                    className={`absolute top-0 right-0 w-20 h-20 bg-linear-to-br ${style.glow} rounded-full blur-xl group-hover:scale-125 transition-all duration-500`}
                  />

                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${style.iconBg}`}>
                        <Ticket className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                        Tier {reward.tier}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-sm text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {reward.nama}
                    </h3>

                    <div className="flex items-center gap-1 mt-1.5 bg-amber-50/50 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-amber-100/50 w-max">
                      <Coins className="w-3.5 h-3.5" />
                      Cost: {reward.poinMin} Poin
                    </div>

                    <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      {reward.deskripsi}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-50">
                    <button
                      type="button"
                      disabled={!isPointsEnough || isRedeemingThis}
                      onClick={() => handleRedeemClick(reward)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 ${
                        isPointsEnough
                          ? "bg-zinc-950 text-white hover:bg-orange-600 hover:shadow-xs active:scale-95"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}>
                      {isRedeemingThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Memproses...
                        </>
                      ) : isPointsEnough ? (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          Tukarkan Kupon
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
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
        <div className="text-center py-16 bg-white border border-zinc-100 rounded-2xl">
          <Ticket className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-zinc-500">
            Anda belum memiliki kupon
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Kupon yang Anda tukar akan muncul di halaman ini. Silakan tukarkan
            poin Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4 w-full">
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
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-all relative overflow-hidden ${
                  coupon.status === "DIGUNAKAN"
                    ? "border-zinc-200 bg-zinc-50/50"
                    : "border-zinc-100"
                }`}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
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
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center mb-3">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-black text-sm text-zinc-900">
                    {coupon.nama}
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5 font-bold">
                    {coupon.kode}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Ditukar: {formattedDate}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(coupon)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-zinc-50 border border-zinc-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-zinc-700 text-[10px] font-bold rounded-xl transition-all">
                    <QrCode className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl relative border border-zinc-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Info className="w-5 h-5" />
            </div>

            <h3 className="font-heading font-black text-base text-zinc-900">
              Konfirmasi Penukaran
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
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

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-xl transition-all">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="flex-1 py-2.5 bg-zinc-950 hover:bg-orange-600 text-white text-[11px] font-bold rounded-xl shadow-md transition-all">
                Ya, Tukarkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR & COUPON DETAIL MODAL (PREMIUM DESIGN) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl relative border border-zinc-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-500 via-amber-500 to-red-600" />

            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <h3 className="font-heading font-black text-lg text-zinc-900 tracking-tight">
                KUPON REWARD AKTIF
              </h3>

              <p className="text-[10px] text-zinc-500 leading-normal max-w-70 mx-auto">
                Tunjukkan QR Code ini ke petugas atau merchant untuk
                memverifikasi dan menggunakan reward Anda.
              </p>
            </div>

            {/* Premium Ticket Card UI */}
            <div className="relative mt-4 bg-linear-to-br from-zinc-50 to-zinc-100 border border-zinc-200/60 rounded-2xl p-4 overflow-hidden">
              {/* Ticket Jagged Cuts (Left & Right side circles) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-r border-zinc-200/60 rounded-full -ml-2" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l border-zinc-200/60 rounded-full -mr-2" />

              {/* QR Code Container */}
              <div className="flex flex-col items-center py-3 border-b border-dashed border-zinc-300">
                <div className="bg-white p-3 rounded-xl shadow-xs border border-zinc-100 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* biome-ignore lint/performance/noImgElement: External dynamic QR API used instead of Next Image to bypass domains whitelist */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      getValidationUrl(showQrModal.kode),
                    )}`}
                    alt="QR Code Kupon"
                    className="w-32 h-32 object-contain"
                  />
                </div>

                <p className="text-[12px] font-mono font-black text-zinc-900 mt-3 tracking-wider bg-white px-3 py-1 rounded-full border border-zinc-200">
                  {showQrModal.kode}
                </p>
              </div>

              {/* Reward Details */}
              <div className="pt-4 space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Nama Reward
                  </span>
                  <span className="text-xs font-black text-zinc-800 block">
                    {showQrModal.nama}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Biaya Poin
                    </span>
                    <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" />
                      {showQrModal.poinCost} Poin
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Status Kupon
                    </span>
                    <span
                      className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
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
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Ketentuan & Penjelasan Barang
                    </span>
                    <p className="text-[10px] text-zinc-500 leading-relaxed bg-white/50 p-2 rounded-lg border border-zinc-200/50">
                      {showQrModal.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
              <a
                href={getValidationUrl(showQrModal.kode)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-zinc-950 hover:bg-orange-600 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
                Uji Halaman Validasi Kupon
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(null)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-xl transition-all">
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
