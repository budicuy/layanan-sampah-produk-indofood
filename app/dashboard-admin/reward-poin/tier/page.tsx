"use client";

import { Coins, Edit2, Info, Save, Ticket, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getTiersData, updateTier } from "./actions";

interface TierData {
  id: string;
  tier: string;
  poinMin: number;
  nama: string;
  deskripsi: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ManageTiersPage() {
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<TierData | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    poinMin: 0,
    deskripsi: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTiersData();
      setTiers(data as unknown as TierData[]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data tier");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleEditClick = (tier: TierData) => {
    setEditingTier(tier);
    setFormData({
      nama: tier.nama,
      poinMin: tier.poinMin,
      deskripsi: tier.deskripsi,
    });
  };

  const handleCancel = () => {
    setEditingTier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    if (formData.poinMin < 0) {
      toast.error("Minimal poin tidak boleh negatif");
      return;
    }
    if (!formData.nama.trim() || !formData.deskripsi.trim()) {
      toast.error("Semua kolom harus diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await updateTier(editingTier.id, {
        nama: formData.nama,
        poinMin: Number(formData.poinMin),
        deskripsi: formData.deskripsi,
      });

      if (res.success) {
        toast.success(`Tier ${editingTier.tier} berhasil diperbarui!`);
        setEditingTier(null);
        await fetchTiers();
      } else {
        toast.error(res.error || "Gagal memperbarui tier");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 font-heading">
          KELOLA TIER & REWARD POIN
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Atur ambang batas poin minimal dan kelola deskripsi penukaran barang
          untuk setiap tingkatan (Diamond, Gold, Platinum).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-zinc-400">
          <p className="text-sm font-medium">Memuat data tier...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiers.map((t) => {
            return (
              <div
                key={t.id}
                className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
                  t.tier === "DIAMOND"
                    ? "border-sky-500/20 bg-linear-to-b from-sky-50/20 to-white"
                    : t.tier === "GOLD"
                      ? "border-amber-500/20 bg-linear-to-b from-amber-50/20 to-white"
                      : "border-zinc-500/20 bg-linear-to-b from-zinc-50/20 to-white"
                }`}>
                {/* Visual Glow Header */}
                <div
                  className={`absolute top-0 left-0 right-0 h-2 ${
                    t.tier === "DIAMOND"
                      ? "bg-sky-500"
                      : t.tier === "GOLD"
                        ? "bg-amber-500"
                        : "bg-zinc-400"
                  }`}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                        t.tier === "DIAMOND"
                          ? "bg-sky-100 text-sky-700"
                          : t.tier === "GOLD"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-200 text-zinc-700"
                      }`}>
                      {t.tier}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      {t.poinMin} Poin Min
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl text-zinc-900">
                    {t.nama}
                  </h3>

                  <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-100 min-h-[100px]">
                    {t.deskripsi}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handleEditClick(t)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95">
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Konfigurasi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-zinc-100 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-500 to-red-500" />

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-500" />
                <h3 className="font-heading font-black text-xl text-zinc-900">
                  Edit Konfigurasi Tier {editingTier.tier}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-1">
                  Nama Tampilan Tier
                </span>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  placeholder="Contoh: Diamond Premium"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-800"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-1">
                  Minimal Poin Penukaran
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.poinMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      poinMin: Number(e.target.value),
                    })
                  }
                  placeholder="Contoh: 1000"
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-800"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-1">
                  Deskripsi & Penjelasan Penukaran Barang
                </span>
                <textarea
                  required
                  rows={4}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  placeholder="Tuliskan daftar barang acak yang bisa ditukarkan..."
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-800 resize-none"
                />
              </div>

              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 flex items-start gap-2 text-orange-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  Perubahan ini akan langsung berdampak pada dashboard konsumen.
                  Poin minimal baru akan digunakan untuk memvalidasi kelayakan
                  penukaran voucher di panel konsumen.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5">
                  {saving ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
