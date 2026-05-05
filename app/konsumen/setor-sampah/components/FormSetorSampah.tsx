"use client";

import { Loader2, Recycle, Send } from "lucide-react";
import { useState } from "react";
import type { JenisSampah } from "@/prisma/generated/prisma/client";
import { submitSetorSampah } from "../actions";

interface Props {
  defaultAlamat?: string;
}

export default function FormSetorSampah({ defaultAlamat }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    jenisSampah: "PLASTIK" as JenisSampah,
    beratEstimasi: "",
    keterangan: "",
    alamatPenjemputan: defaultAlamat ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitSetorSampah({
        jenisSampah: form.jenisSampah,
        beratEstimasi: Number(form.beratEstimasi),
        keterangan: form.keterangan || undefined,
        alamatPenjemputan: form.alamatPenjemputan,
      });
      setSuccess(true);
      setForm({
        jenisSampah: "PLASTIK",
        beratEstimasi: "",
        keterangan: "",
        alamatPenjemputan: defaultAlamat ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[24px] p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Recycle className="text-green-600 w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-green-800">
          Pengajuan Berhasil!
        </h3>
        <p className="text-green-700 text-sm">
          Data setor sampah Anda sudah dikirim. Tunggu verifikasi dari admin.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">
          Ajukan Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Jenis Sampah */}
      <div>
        <label
          htmlFor="jenisSampah"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Jenis Sampah <span className="text-red-500">*</span>
        </label>
        <select
          id="jenisSampah"
          value={form.jenisSampah}
          onChange={(e) =>
            setForm({ ...form, jenisSampah: e.target.value as JenisSampah })
          }
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required>
          <option value="PLASTIK">Plastik</option>
          <option value="KARTON">Karton / Kardus</option>
        </select>
      </div>

      {/* Berat Estimasi */}
      <div>
        <label
          htmlFor="beratEstimasi"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Estimasi Berat (kg) <span className="text-red-500">*</span>
        </label>
        <input
          id="beratEstimasi"
          type="number"
          min="0.1"
          step="0.1"
          value={form.beratEstimasi}
          onChange={(e) => setForm({ ...form, beratEstimasi: e.target.value })}
          placeholder="Contoh: 2.5"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required
        />
      </div>

      {/* Alamat Penjemputan */}
      <div>
        <label
          htmlFor="alamatPenjemputan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Alamat Penjemputan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="alamatPenjemputan"
          value={form.alamatPenjemputan}
          onChange={(e) =>
            setForm({ ...form, alamatPenjemputan: e.target.value })
          }
          placeholder="Masukkan alamat lengkap untuk penjemputan..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          required
        />
      </div>

      {/* Keterangan */}
      <div>
        <label
          htmlFor="keterangan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Keterangan Tambahan{" "}
          <span className="text-zinc-400 font-normal">(opsional)</span>
        </label>
        <textarea
          id="keterangan"
          value={form.keterangan}
          onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          placeholder="Catatan tambahan untuk petugas..."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
      </div>

      <button
        id="btn-submit-setor-sampah"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {loading ? "Mengirim..." : "Ajukan Setor Sampah"}
      </button>
    </form>
  );
}
