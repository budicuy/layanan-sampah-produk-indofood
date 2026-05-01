"use client";

import {
  CheckCircle2,
  CreditCard,
  Edit2,
  Filter,
  MapPin,
  Phone,
  Plus,
  Recycle,
  Search,
  Tag,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type {
  KategoriNasabah,
  StatusNasabah,
  User,
} from "@/prisma/generated/prisma/client";
import { createNasabah, deleteNasabah, updateNasabah } from "../actions";

export type Nasabah = {
  id: string;
  nama: string;
  alamat: string;
  noTelp: string;
  kategori: KategoriNasabah;
  nik: string;
  noRek: string;
  jenisBank: string;
  titikLokasi: string | null;
  status: StatusNasabah;
  user: User | null;
};

export default function NasabahList({
  initialData,
}: {
  initialData: Nasabah[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = initialData.filter(
    (n) =>
      n.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nik.includes(searchTerm),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nama: formData.get("nama") as string,
      alamat: formData.get("alamat") as string,
      noTelp: formData.get("noTelp") as string,
      kategori: formData.get("kategori") as KategoriNasabah,
      nik: formData.get("nik") as string,
      noRek: formData.get("noRek") as string,
      jenisBank: formData.get("jenisBank") as string,
      titikLokasi: (formData.get("titikLokasi") as string) || undefined,
      status: formData.get("status") as StatusNasabah,
    };

    if (selectedNasabah) {
      await updateNasabah(selectedNasabah.id, data);
    } else {
      await createNasabah(data);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedNasabah) {
      await deleteNasabah(selectedNasabah.id);
      closeDeleteModal();
    }
  };

  const openModal = (nasabah: Nasabah | null = null) => {
    setSelectedNasabah(nasabah);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNasabah(null);
  };

  const openDeleteModal = (nasabah: Nasabah) => {
    setSelectedNasabah(nasabah);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedNasabah(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Data Nasabah Bank
          </h1>
          <p className="text-zinc-500 mt-1">
            Manajemen dan monitoring seluruh nasabah bank sampah.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Nasabah
        </button>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-red-50/50 rounded-[24px] border border-red-100 p-6 shadow-sm group hover:bg-red-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wider">
              Total
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seluruh Nasabah</p>
        </div>

        {/* Aktif */}
        <div className="bg-green-50/50 rounded-[24px] border border-green-100 p-6 shadow-sm group hover:bg-green-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Aktif
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-green-600">
            {initialData.filter((n) => n.status === "AKTIF").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Nasabah Aktif</p>
        </div>

        {/* Perorangan */}
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm group hover:bg-sky-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Personal
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((n) => n.kategori === "PERORANGAN").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Kategori Perorangan</p>
        </div>

        {/* Warmiendo */}
        <div className="bg-amber-50/50 rounded-[24px] border border-amber-100 p-6 shadow-sm group hover:bg-amber-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Tag size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Warmiendo
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((n) => n.kategori === "WARMIENDO").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Mitra Warmiendo</p>
        </div>

        {/* Bank Sampah */}
        <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-6 shadow-sm group hover:bg-emerald-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Recycle size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Unit
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((n) => n.kategori === "BANK_SAMPAH").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Unit Bank Sampah</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Nasabah
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nasabah..."
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
                  Nasabah
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak & Alamat
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Rekening
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Status
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
                    colSpan={6}
                    className="px-8 py-12 text-center text-zinc-500">
                    Tidak ada data nasabah ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-zinc-900">{n.nama}</p>
                      <p className="text-xs text-zinc-400 mt-1 font-mono uppercase tracking-tighter">
                        NIK: {n.nik}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={14} className="text-zinc-400" />
                        {n.noTelp}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-zinc-400" />
                        {n.alamat}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold">
                        <Tag size={12} /> {n.kategori.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm">
                      <div className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
                        <CreditCard size={14} className="text-zinc-400" />
                        {n.noRek}
                      </div>
                      <p className="text-xs text-zinc-400 uppercase">
                        {n.jenisBank}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {n.status === "AKTIF" ? (
                        <div className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs">
                          <CheckCircle2 size={14} /> AKTIF
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-zinc-400 font-bold text-xs">
                          <XCircle size={14} /> NONAKTIF
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(n)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-red-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(n)}
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
                {selectedNasabah ? "Edit Nasabah" : "Tambah Nasabah Baru"}
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
                    htmlFor="nama"
                    className="text-sm font-bold text-zinc-700">
                    Nama Lengkap
                  </label>
                  <input
                    id="nama"
                    required
                    name="nama"
                    defaultValue={selectedNasabah?.nama}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="nik"
                    className="text-sm font-bold text-zinc-700">
                    NIK (No Nasabah)
                  </label>
                  <input
                    id="nik"
                    required
                    name="nik"
                    defaultValue={selectedNasabah?.nik}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="noTelp"
                    className="text-sm font-bold text-zinc-700">
                    Nomor Telepon
                  </label>
                  <input
                    id="noTelp"
                    required
                    name="noTelp"
                    defaultValue={selectedNasabah?.noTelp}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="kategori"
                    className="text-sm font-bold text-zinc-700">
                    Kategori
                  </label>
                  <select
                    id="kategori"
                    name="kategori"
                    defaultValue={selectedNasabah?.kategori}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="PERORANGAN">Perorangan</option>
                    <option value="BANK_SAMPAH">Bank Sampah</option>
                    <option value="WARMIENDO">Warmiendo</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="alamat"
                    className="text-sm font-bold text-zinc-700">
                    Alamat
                  </label>
                  <textarea
                    id="alamat"
                    required
                    name="alamat"
                    defaultValue={selectedNasabah?.alamat}
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="jenisBank"
                    className="text-sm font-bold text-zinc-700">
                    Jenis Bank
                  </label>
                  <input
                    id="jenisBank"
                    required
                    name="jenisBank"
                    defaultValue={selectedNasabah?.jenisBank}
                    placeholder="BCA, Mandiri, BRI..."
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="noRek"
                    className="text-sm font-bold text-zinc-700">
                    Nomor Rekening
                  </label>
                  <input
                    id="noRek"
                    required
                    name="noRek"
                    defaultValue={selectedNasabah?.noRek}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="titikLokasi"
                    className="text-sm font-bold text-zinc-700">
                    Titik Lokasi (Opsional)
                  </label>
                  <input
                    id="titikLokasi"
                    name="titikLokasi"
                    defaultValue={selectedNasabah?.titikLokasi || ""}
                    placeholder="-6.123, 106.123"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-bold text-zinc-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={selectedNasabah?.status}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
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
              Apakah Anda yakin ingin menghapus nasabah{" "}
              <span className="font-bold text-zinc-900">
                {selectedNasabah?.nama}
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
