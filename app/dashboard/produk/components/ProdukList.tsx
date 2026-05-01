"use client";

import {
  Box,
  DollarSign,
  Edit2,
  Filter,
  PackageOpen,
  Plus,
  Scale,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { JenisProduk } from "@/prisma/generated/prisma/client";
import { createProduk, deleteProduk, updateProduk } from "../actions";

export type Produk = {
  id: string;
  kode: string;
  nama: string;
  jenis: JenisProduk;
  berat: number;
  brand: string;
  harga: number;
  isi: number;
};

export default function ProdukList({ initialData }: { initialData: Produk[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = initialData.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      kode: formData.get("kode") as string,
      nama: formData.get("nama") as string,
      jenis: formData.get("jenis") as JenisProduk,
      berat: parseFloat(formData.get("berat") as string),
      brand: formData.get("brand") as string,
      harga: parseInt(formData.get("harga") as string, 10),
      isi: parseInt(formData.get("isi") as string, 10),
    };

    if (selectedProduk) {
      await updateProduk(selectedProduk.id, data);
    } else {
      await createProduk(data);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedProduk) {
      await deleteProduk(selectedProduk.id);
      closeDeleteModal();
    }
  };

  const openModal = (produk: Produk | null = null) => {
    setSelectedProduk(produk);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduk(null);
  };

  const openDeleteModal = (produk: Produk) => {
    setSelectedProduk(produk);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProduk(null);
  };

  // Format currency
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Data Produk
          </h1>
          <p className="text-zinc-500 mt-1">
            Manajemen master data produk dan kemasan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Produk
        </button>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm group hover:bg-sky-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Box size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Total
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seluruh Produk</p>
        </div>

        {/* Plastik */}
        <div className="bg-amber-50/50 rounded-[24px] border border-amber-100 p-6 shadow-sm group hover:bg-amber-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <PackageOpen size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Plastik
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((p) => p.jenis === "PLASTIK").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Produk Plastik</p>
        </div>

        {/* Karton */}
        <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-6 shadow-sm group hover:bg-emerald-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <PackageOpen size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Karton
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((p) => p.jenis === "KARTON").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Produk Karton</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Produk
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full md:w-64"
              />
            </div>
            <button
              type="button"
              className="p-2 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Produk & Brand
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Jenis
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat & Isi
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Harga
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
                    Tidak ada data produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-zinc-900">{p.nama}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-400 font-mono uppercase tracking-tighter">
                          KODE: {p.kode}
                        </p>
                        <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                        <p className="text-xs font-medium text-zinc-500">
                          {p.brand}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          p.jenis === "PLASTIK"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                        <Tag size={12} /> {p.jenis}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale size={14} className="text-zinc-400" />
                        {p.berat} Kg
                      </div>
                      <div className="flex items-center gap-2">
                        <PackageOpen size={14} className="text-zinc-400" />
                        Isi: {p.isi}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-zinc-900 flex items-center gap-2">
                        <DollarSign size={14} className="text-zinc-400" />
                        {formatRupiah(p.harga)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(p)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(p)}
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
                {selectedProduk ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="kode"
                    className="text-sm font-bold text-zinc-700">
                    Kode Produk
                  </label>
                  <input
                    id="kode"
                    required
                    name="kode"
                    defaultValue={selectedProduk?.kode}
                    placeholder="PRD-001"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="nama"
                    className="text-sm font-bold text-zinc-700">
                    Nama Produk
                  </label>
                  <input
                    id="nama"
                    required
                    name="nama"
                    defaultValue={selectedProduk?.nama}
                    placeholder="Indomie Goreng"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="brand"
                    className="text-sm font-bold text-zinc-700">
                    Brand Produk
                  </label>
                  <input
                    id="brand"
                    required
                    name="brand"
                    defaultValue={selectedProduk?.brand}
                    placeholder="Indofood"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="jenis"
                    className="text-sm font-bold text-zinc-700">
                    Jenis
                  </label>
                  <select
                    id="jenis"
                    name="jenis"
                    defaultValue={selectedProduk?.jenis}
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
                    defaultValue={selectedProduk?.berat}
                    placeholder="0.5"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="isi"
                    className="text-sm font-bold text-zinc-700">
                    Isi (Quantity)
                  </label>
                  <input
                    id="isi"
                    required
                    type="number"
                    name="isi"
                    defaultValue={selectedProduk?.isi}
                    placeholder="40"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
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
                    defaultValue={selectedProduk?.harga}
                    placeholder="100000"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 font-heading text-center mb-2">
              Hapus Data?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus produk{" "}
              <span className="font-bold text-zinc-900">
                {selectedProduk?.nama}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
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
