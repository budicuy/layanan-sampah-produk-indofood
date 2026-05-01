"use client";

import {
  Calendar,
  Coins,
  Edit2,
  Plus,
  Scale,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { JenisSampah } from "@/prisma/generated/prisma/client";
import {
  createHargaSampah,
  deleteHargaSampah,
  updateHargaSampah,
} from "../actions";

export type HargaSampahData = {
  id: string;
  harga: number;
  bulan: Date;
  jenisSampah: JenisSampah;
  berat: number;
};

export default function HargaSampahList({
  initialData,
}: {
  initialData: HargaSampahData[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHarga, setSelectedHarga] = useState<HargaSampahData | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = initialData.filter(
    (h) =>
      h.jenisSampah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.bulan
        .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      harga: parseInt(formData.get("harga") as string, 10),
      bulan: new Date(formData.get("bulan") as string),
      jenisSampah: formData.get("jenisSampah") as JenisSampah,
      berat: parseFloat(formData.get("berat") as string),
    };

    if (selectedHarga) {
      const res = await updateHargaSampah(selectedHarga.id, data);
      if (res.success) toast.success("Data harga berhasil diperbarui!");
    } else {
      const res = await createHargaSampah(data);
      if (res.success) toast.success("Data harga berhasil ditambahkan!");
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedHarga) {
      const res = await deleteHargaSampah(selectedHarga.id);
      if (res.success) toast.success("Data harga berhasil dihapus!");
      closeDeleteModal();
    }
  };

  const openModal = (harga: HargaSampahData | null = null) => {
    setSelectedHarga(harga);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHarga(null);
  };

  const openDeleteModal = (harga: HargaSampahData) => {
    setSelectedHarga(harga);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedHarga(null);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const averageHarga = (jenis: JenisSampah) => {
    const data = initialData.filter((h) => h.jenisSampah === jenis);
    if (data.length === 0) return 0;
    return data.reduce((acc, curr) => acc + curr.harga, 0) / data.length;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Master Harga Sampah
          </h1>
          <p className="text-zinc-500 mt-1">
            Pengaturan harga acuan sampah per kategori dan periode.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Harga
        </button>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm group hover:bg-sky-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Avg Plastik
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {formatRupiah(averageHarga("PLASTIK"))}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Rata-rata Harga Plastik</p>
        </div>

        <div className="bg-amber-50/50 rounded-[24px] border border-amber-100 p-6 shadow-sm group hover:bg-amber-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Avg Karton
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {formatRupiah(averageHarga("KARTON"))}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Rata-rata Harga Karton</p>
        </div>

        <div className="bg-zinc-50 rounded-[24px] border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-600">
              <Coins size={20} />
            </div>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200 px-2 py-1 rounded-full uppercase tracking-wider">
              Records
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Total Data Harga</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Harga Acuan
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari periode/jenis..."
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
                  Periode Bulan
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Jenis Sampah
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Harga (Rp)
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat (Kg)
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
                    colSpan={5}
                    className="px-8 py-12 text-center text-zinc-500">
                    Belum ada data harga sampah.
                  </td>
                </tr>
              ) : (
                filteredData.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <Calendar size={14} className="text-zinc-400" />
                        {new Date(h.bulan).toLocaleDateString("id-ID", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          h.jenisSampah === "PLASTIK"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        <Tag size={12} /> {h.jenisSampah}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-zinc-900">
                      {formatRupiah(h.harga)}
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-zinc-400" />
                        {h.berat} Kg
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(h)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(h)}
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-zinc-900 font-heading">
                {selectedHarga ? "Edit Harga" : "Tambah Harga Baru"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="bulan"
                  className="text-sm font-bold text-zinc-700">
                  Periode Bulan
                </label>
                <input
                  id="bulan"
                  required
                  type="month"
                  name="bulan"
                  defaultValue={
                    selectedHarga
                      ? new Date(selectedHarga.bulan).toISOString().slice(0, 7)
                      : ""
                  }
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="jenisSampah"
                    className="text-sm font-bold text-zinc-700">
                    Jenis Sampah
                  </label>
                  <select
                    id="jenisSampah"
                    name="jenisSampah"
                    defaultValue={selectedHarga?.jenisSampah || "PLASTIK"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="PLASTIK">Plastik</option>
                    <option value="KARTON">Karton</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="harga"
                    className="text-sm font-bold text-zinc-700">
                    Harga (Rp)
                  </label>
                  <input
                    id="harga"
                    required
                    type="number"
                    name="harga"
                    defaultValue={selectedHarga?.harga}
                    placeholder="Contoh: 5000"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
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
                  defaultValue={selectedHarga?.berat}
                  placeholder="Contoh: 1.0"
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                />
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-md rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 font-heading text-center mb-2">
              Hapus Data Harga?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus data harga periode ini?
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
