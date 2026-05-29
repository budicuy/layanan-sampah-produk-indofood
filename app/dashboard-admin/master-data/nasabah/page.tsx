"use client";

import {
  AtSign,
  CheckCircle2,
  CreditCard,
  Edit2,
  MapPin,
  Phone,
  Plus,
  Recycle,
  Search,
  Tag,
  Trash2,
  User2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { KategoriNasabah, StatusNasabah } from "@/lib/db/schema";
import {
  createNasabah,
  deleteNasabah,
  getAvailableUsers,
  getNasabahData,
  updateNasabah,
} from "./actions";

export type Nasabah = {
  id: string;
  alamat: string;
  noTelp: string;
  kategori: KategoriNasabah;
  nik: string;
  noRek: string;
  jenisBank: string;
  titikLokasi: string | null;
  status: StatusNasabah;
  user: { id: string; name: string; username: string; email: string } | null;
};

export default function NasabahPage() {
  const [data, setData] = useState<Nasabah[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    perorangan: 0,
    warmiendo: 0,
    bankSampah: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [availableUsers, setAvailableUsers] = useState<
    { id: string; name: string; username: string }[]
  >([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    username: string;
  } | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [_refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".relative")) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getNasabahData({
      page: currentPage,
      pageSize,
      searchTerm,
      filterKategori,
      filterStatus,
    }).then((res) => {
      const result = res as {
        data: Nasabah[];
        total: number;
        stats: {
          total: number;
          aktif: number;
          perorangan: number;
          warmiendo: number;
          bankSampah: number;
        };
      };
      setData(result.data);
      setTotal(result.total);
      setStats(result.stats);
      setIsLoading(false);
    });
  }, [currentPage, pageSize, searchTerm, filterKategori, filterStatus]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleKategoriChange = (val: string) => {
    setFilterKategori(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nasabahData = {
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
      await updateNasabah(selectedNasabah.id, nasabahData);
      toast.success("Data nasabah berhasil diperbarui!");
    } else {
      if (!selectedUser) {
        toast.error("Silakan pilih user terlebih dahulu");
        return;
      }
      await createNasabah({
        ...nasabahData,
        userId: selectedUser.id,
      });
      toast.success("Data nasabah berhasil ditambahkan!");
    }

    triggerRefresh();
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedNasabah) {
      await deleteNasabah(selectedNasabah.id);
      toast.success("Data nasabah berhasil dihapus!");
      triggerRefresh();
      closeDeleteModal();
    }
  };

  const openModal = async (nasabah: Nasabah | null = null) => {
    if (!nasabah) {
      const users = await getAvailableUsers();
      setAvailableUsers(
        users as { id: string; name: string; username: string }[],
      );
      setSelectedUser(null);
      setUserSearch("");
    } else {
      setSelectedUser(null);
    }
    setSelectedNasabah(nasabah);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNasabah(null);
    setSelectedUser(null);
    setUserSearch("");
    setIsUserDropdownOpen(false);
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
            Manajemen dan monitoring seluruh nasabah SICUAN.
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
            {stats.total}
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
            {stats.aktif}
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
            {stats.perorangan}
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
            {stats.warmiendo}
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
            {stats.bankSampah}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Unit SICUAN</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Nasabah
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nasabah..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full lg:w-64"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => handleKategoriChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              <option value="PERORANGAN">Perorangan</option>
              <option value="BANK_SAMPAH">SICUAN</option>
              <option value="WARMIENDO">Warmiendo</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Nasabah
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak & Alamat
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Akun User
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Rekening
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 md:px-8 py-12 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 md:px-8 py-12 text-center text-zinc-500">
                    Tidak ada data nasabah ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <p className="font-bold text-zinc-900 text-sm md:text-base">
                        {n.user?.name || "Tanpa Nama"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 font-mono uppercase tracking-tighter">
                        NIK: {n.nik}
                      </p>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-zinc-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone size={14} className="text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[120px] md:max-w-[200px]">
                          {n.noTelp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[120px] md:max-w-[200px]">
                          {n.alamat}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      {n.user ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-zinc-800">
                            <User2
                              size={13}
                              className="text-zinc-400 shrink-0"
                            />
                            <span className="truncate max-w-[100px] md:max-w-[150px]">
                              {n.user.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-400">
                            <AtSign
                              size={11}
                              className="text-zinc-400 shrink-0"
                            />
                            <span className="truncate max-w-[100px] md:max-w-[150px]">
                              {n.user.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          Belum ada user
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <span className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-[10px] md:text-xs font-bold">
                        <Tag size={12} /> {n.kategori.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm">
                      <div className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
                        <CreditCard
                          size={14}
                          className="text-zinc-400 shrink-0"
                        />
                        {n.noRek}
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-400 uppercase">
                        {n.jenisBank}
                      </p>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      {n.status === "AKTIF" ? (
                        <div className="inline-flex items-center gap-1.5 text-green-600 font-bold text-[10px] md:text-xs">
                          <CheckCircle2 size={14} /> AKTIF
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] md:text-xs">
                          <XCircle size={14} /> NONAKTIF
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(n)}
                          className="p-1.5 md:p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-red-50 rounded-lg">
                          <Edit2
                            size={16}
                            className="md:w-[18px] md:h-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(n)}
                          className="p-1.5 md:p-2 text-zinc-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg">
                          <Trash2
                            size={16}
                            className="md:w-[18px] md:h-[18px]"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-5 md:p-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/30">
            <p className="text-sm text-zinc-500">
              Menampilkan{" "}
              <span className="font-bold text-zinc-700">{data.length}</span>{" "}
              dari <span className="font-bold text-zinc-700">{total}</span>{" "}
              nasabah
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}>
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
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
                    htmlFor={selectedNasabah ? "nama" : "userId"}
                    className="text-sm font-bold text-zinc-700">
                    Nama Lengkap
                  </label>
                  {selectedNasabah ? (
                    <input
                      id="nama"
                      disabled
                      value={selectedNasabah.user?.name || ""}
                      className="w-full px-4 py-3 bg-zinc-100 border-none rounded-xl text-zinc-500 cursor-not-allowed font-bold"
                    />
                  ) : (
                    <div className="relative">
                      {!selectedUser ? (
                        <div className="relative">
                          <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                          />
                          <input
                            type="text"
                            placeholder="Cari nama atau username..."
                            value={userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              setIsUserDropdownOpen(true);
                            }}
                            onFocus={() => setIsUserDropdownOpen(true)}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl group animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {selectedUser.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900 leading-tight">
                                {selectedUser.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                @{selectedUser.username}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(null);
                              setUserSearch("");
                            }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                            <X size={18} />
                          </button>
                        </div>
                      )}

                      {isUserDropdownOpen && !selectedUser && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                          {availableUsers.filter(
                            (u) =>
                              u.name
                                .toLowerCase()
                                .includes(userSearch.toLowerCase()) ||
                              u.username
                                .toLowerCase()
                                .includes(userSearch.toLowerCase()),
                          ).length === 0 ? (
                            <div className="p-6 text-center">
                              <p className="text-zinc-400 text-sm mb-3">
                                {availableUsers.length === 0
                                  ? "Tidak ada user konsumen yang tersedia untuk didaftarkan."
                                  : "User tidak ditemukan."}
                              </p>
                              <a
                                href="/dashboard-admin/master-data/users"
                                className="text-xs font-bold text-primary hover:underline">
                                + Buat User Konsumen Baru
                              </a>
                            </div>
                          ) : (
                            availableUsers
                              .filter(
                                (u) =>
                                  u.name
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()) ||
                                  u.username
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()),
                              )
                              .map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsUserDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors flex flex-col border-b border-zinc-50 last:border-none">
                                  <span className="font-bold text-zinc-900 text-sm">
                                    {u.name}
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    @{u.username}
                                  </span>
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="nik"
                    className="text-sm font-bold text-zinc-700">
                    NIK
                  </label>
                  <input
                    id="nik"
                    required
                    name="nik"
                    maxLength={16}
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
                    <option value="BANK_SAMPAH">SICUAN</option>
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

              {/* User Account Fields removed per request */}

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
              Hapus Data?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus nasabah{" "}
              <span className="font-bold text-zinc-900">
                {selectedNasabah?.user?.name}
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
