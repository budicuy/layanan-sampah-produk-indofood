"use client";

import {
  Calendar,
  Clock,
  Edit2,
  FileText,
  Plus,
  Scale,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { JenisSampah } from "@/prisma/generated/prisma/client";
import { createLaporan, deleteLaporan, updateLaporan } from "../actions";

export type LaporanData = {
  id: string;
  nasabahId: string;
  nasabah: {
    id: string;
    nama: string;
    kategori: string;
  };
  jenisSampah: JenisSampah;
  berat: number;
  produkId: string | null;
  produk: {
    id: string;
    nama: string;
    brand: string;
  } | null;
  createdAt: Date;
};

export default function LaporanList({
  initialData,
  nasabahs,
  produks,
}: {
  initialData: LaporanData[];
  nasabahs: { id: string; nama: string; kategori: string }[];
  produks: { id: string; nama: string; brand: string }[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanData | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = initialData.filter(
    (l) =>
      l.nasabah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.jenisSampah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.produk?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const produkIdVal = formData.get("produkId") as string;
    const data = {
      nasabahId: formData.get("nasabahId") as string,
      jenisSampah: formData.get("jenisSampah") as JenisSampah,
      berat: parseFloat(formData.get("berat") as string),
      produkId: produkIdVal === "NULL" ? null : produkIdVal,
    };

    if (selectedLaporan) {
      const res = await updateLaporan(selectedLaporan.id, data);
      if (res.success) toast.success("Laporan berhasil diperbarui!");
    } else {
      const res = await createLaporan(data);
      if (res.success) toast.success("Laporan berhasil ditambahkan!");
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedLaporan) {
      const res = await deleteLaporan(selectedLaporan.id);
      if (res.success) toast.success("Laporan berhasil dihapus!");
      closeDeleteModal();
    }
  };

  const openModal = (laporan: LaporanData | null = null) => {
    setSelectedLaporan(laporan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLaporan(null);
  };

  const openDeleteModal = (laporan: LaporanData) => {
    setSelectedLaporan(laporan);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedLaporan(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Laporan Pendataan
          </h1>
          <p className="text-zinc-500 mt-1">
            Catat dan kelola data masuk sampah dari nasabah.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Laporan
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <FileText size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Total Entri
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Laporan Terdaftar</p>
        </div>

        <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Scale size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Total Berat
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.reduce((acc, curr) => acc + curr.berat, 0).toFixed(2)}{" "}
            Kg
          </p>
          <p className="text-xs text-zinc-500 mt-1">Sampah Terkumpul</p>
        </div>

        <div className="bg-purple-50/50 rounded-[24px] border border-purple-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <User size={20} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Nasabah Aktif
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {new Set(initialData.map((l) => l.nasabahId)).size}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Berkontribusi</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Laporan
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari laporan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  NO
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Timestamps
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Nasabah
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Jenis Sampah
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Jenis Produk
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-8 py-12 text-center text-zinc-500">
                    Tidak ada data laporan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((l, index) => (
                  <tr
                    key={l.id}
                    className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-6 text-sm text-zinc-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm">
                          <Calendar size={12} className="text-zinc-400" />
                          {new Date(l.createdAt).toLocaleDateString("id-ID")}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
                          <Clock size={12} />
                          {new Date(l.createdAt).toLocaleTimeString("id-ID")}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xs">
                          {l.nasabah.nama[0]}
                        </div>
                        <span className="font-bold text-zinc-900">
                          {l.nasabah.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                        {l.nasabah.kategori.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          l.jenisSampah === "PLASTIK"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        <Tag size={12} /> {l.jenisSampah}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-zinc-400" />
                        {l.berat} Kg
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {l.produk ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 text-sm">
                            {l.produk.nama}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {l.produk.brand}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-sm">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(l)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(l)}
                          className="p-2 text-zinc-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-zinc-900 font-heading">
                {selectedLaporan ? "Edit Laporan" : "Tambah Laporan Baru"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="nasabahId"
                    className="text-sm font-bold text-zinc-700">
                    Nasabah
                  </label>
                  <select
                    id="nasabahId"
                    required
                    name="nasabahId"
                    defaultValue={selectedLaporan?.nasabahId}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="">-- Pilih Nasabah --</option>
                    {nasabahs.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nama} ({n.kategori.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="jenisSampah"
                    className="text-sm font-bold text-zinc-700">
                    Jenis Sampah
                  </label>
                  <select
                    id="jenisSampah"
                    required
                    name="jenisSampah"
                    defaultValue={selectedLaporan?.jenisSampah || "PLASTIK"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="PLASTIK">Plastik</option>
                    <option value="KARTON">Karton</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="berat"
                    className="text-sm font-bold text-zinc-700">
                    Berat (Kg)
                  </label>
                  <input
                    id="berat"
                    required
                    type="number"
                    step="0.01"
                    name="berat"
                    defaultValue={selectedLaporan?.berat}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="produkId"
                    className="text-sm font-bold text-zinc-700">
                    Jenis Produk (Master Data)
                  </label>
                  <select
                    id="produkId"
                    name="produkId"
                    defaultValue={selectedLaporan?.produkId || "NULL"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="NULL">-- Pilih Produk (Opsional) --</option>
                    {produks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} - {p.brand}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 font-heading text-center mb-2">
              Hapus Laporan?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus data laporan ini? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
