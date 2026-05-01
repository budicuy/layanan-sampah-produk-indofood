"use client";

import {
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { StatusEkpedisi } from "@/prisma/generated/prisma/client";
import { createEkpedisi, deleteEkpedisi, updateEkpedisi } from "../actions";

export type EkpedisiData = {
  id: string;
  userId: string | null;
  noTelp: string;
  alamat: string;
  titikLokasi: string | null;
  status: StatusEkpedisi;
  user?: {
    id: string;
    name: string;
    username: string;
  } | null;
};

export default function EkpedisiList({
  initialData,
  users,
}: {
  initialData: EkpedisiData[];
  users: { id: string; name: string; username: string }[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEkpedisi, setSelectedEkpedisi] = useState<EkpedisiData | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = initialData.filter(
    (e) =>
      e.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.noTelp.includes(searchTerm) ||
      e.user?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userIdVal = formData.get("userId") as string;
    const data = {
      userId: userIdVal === "NULL" ? null : userIdVal,
      noTelp: formData.get("noTelp") as string,
      alamat: formData.get("alamat") as string,
      titikLokasi: (formData.get("titikLokasi") as string) || null,
      status: formData.get("status") as StatusEkpedisi,
    };

    if (selectedEkpedisi) {
      const res = await updateEkpedisi(selectedEkpedisi.id, data);
      if (res.success) {
        toast.success("Ekpedisi berhasil diperbarui!");
      } else {
        toast.error(res.error || "Gagal memperbarui ekpedisi");
      }
    } else {
      const res = await createEkpedisi(data);
      if (res.success) {
        toast.success("Ekpedisi berhasil ditambahkan!");
      } else {
        toast.error(res.error || "Gagal menambahkan ekpedisi");
      }
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedEkpedisi) {
      const res = await deleteEkpedisi(selectedEkpedisi.id);
      if (res.success) {
        toast.success("Ekpedisi berhasil dihapus!");
      } else {
        toast.error(res.error || "Gagal menghapus ekpedisi");
      }
      closeDeleteModal();
    }
  };

  const openModal = (ekpedisi: EkpedisiData | null = null) => {
    setSelectedEkpedisi(ekpedisi);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEkpedisi(null);
  };

  const openDeleteModal = (ekpedisi: EkpedisiData) => {
    setSelectedEkpedisi(ekpedisi);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedEkpedisi(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Data Ekspedisi
          </h1>
          <p className="text-zinc-500 mt-1">
            Manajemen logistik dan pengiriman sampah.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah Ekspedisi
        </button>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm group hover:bg-sky-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Truck size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Total
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seluruh Armada</p>
        </div>

        {/* Belum Di Proses */}
        <div className="bg-red-50/50 rounded-[24px] border border-red-100 p-6 shadow-sm group hover:bg-red-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Pending
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((e) => e.status === "BELUM_DI_PROSES").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Belum Diproses</p>
        </div>

        {/* Proses */}
        <div className="bg-amber-50/50 rounded-[24px] border border-amber-100 p-6 shadow-sm group hover:bg-amber-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <RefreshCcw size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Proses
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((e) => e.status === "PROSES").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Dalam Perjalanan</p>
        </div>

        {/* Done */}
        <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-6 shadow-sm group hover:bg-emerald-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Selesai
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {initialData.filter((e) => e.status === "DONE").length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Pengiriman Berhasil</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Ekspedisi
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari ekspedisi..."
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
                  Pengemudi / User
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak
                </th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Lokasi / Alamat
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
                    colSpan={5}
                    className="px-8 py-12 text-center text-zinc-500">
                    Tidak ada data ekspedisi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-600">
                          <User size={18} />
                        </div>
                        <div>
                          {e.user ? (
                            <>
                              <p className="font-bold text-zinc-900">
                                {e.user.name}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                @{e.user.username}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-zinc-500 italic">
                              Tanpa User
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-zinc-400" />
                        {e.noTelp}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-600">
                      <div className="flex items-start gap-2 max-w-xs">
                        <MapPin
                          size={14}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="line-clamp-2">{e.alamat}</p>
                          {e.titikLokasi && (
                            <p className="text-xs text-zinc-400 mt-1 font-mono">
                              {e.titikLokasi}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          e.status === "DONE"
                            ? "bg-emerald-100 text-emerald-700"
                            : e.status === "PROSES"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}>
                        {e.status === "DONE" && <CheckCircle2 size={12} />}
                        {e.status === "PROSES" && <RefreshCcw size={12} />}
                        {e.status === "BELUM_DI_PROSES" && <Clock size={12} />}
                        {e.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(e)}
                          className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(e)}
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
                {selectedEkpedisi ? "Edit Ekspedisi" : "Tambah Ekspedisi Baru"}
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
                    htmlFor="userId"
                    className="text-sm font-bold text-zinc-700">
                    User / Pengemudi
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    defaultValue={selectedEkpedisi?.userId || "NULL"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="NULL">-- Pilih User (Opsional) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>
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
                    defaultValue={selectedEkpedisi?.noTelp}
                    placeholder="0812xxxx"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="alamat"
                    className="text-sm font-bold text-zinc-700">
                    Alamat Lengkap
                  </label>
                  <textarea
                    id="alamat"
                    required
                    name="alamat"
                    rows={2}
                    defaultValue={selectedEkpedisi?.alamat}
                    placeholder="Jl. Raya Utama No.123..."
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="titikLokasi"
                    className="text-sm font-bold text-zinc-700">
                    Titik Lokasi (Koordinat)
                  </label>
                  <input
                    id="titikLokasi"
                    name="titikLokasi"
                    defaultValue={selectedEkpedisi?.titikLokasi || ""}
                    placeholder="-6.123, 106.456"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-bold text-zinc-700">
                    Status Ekspedisi
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={selectedEkpedisi?.status || "BELUM_DI_PROSES"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="BELUM_DI_PROSES">Belum Di Proses</option>
                    <option value="PROSES">Proses</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
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
              Hapus Ekspedisi?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus jadwal pengiriman/ekspedisi ini?
              Tindakan ini tidak dapat dibatalkan.
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
