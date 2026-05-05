"use client";

import { CheckCircle, Loader2, PackageCheck } from "lucide-react";
import { useState } from "react";
import { konfirmasiSerahTerima } from "../actions";

interface Props {
  setorSampahId: string;
}

export default function BtnKonfirmasiSerahTerima({ setorSampahId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKonfirmasi() {
    if (
      !confirm(
        "Apakah Anda sudah menyerahkan sampah kepada kurir? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      await konfirmasiSerahTerima(setorSampahId);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
        <CheckCircle size={16} />
        Sudah diserahkan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        id={`btn-serah-terima-${setorSampahId}`}
        type="button"
        onClick={handleKonfirmasi}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-60 transition-all active:scale-95">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <PackageCheck size={14} />
        )}
        {loading ? "Memproses..." : "Konfirmasi Sudah Diserahkan"}
      </button>
    </div>
  );
}
