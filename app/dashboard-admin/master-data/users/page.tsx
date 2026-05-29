"use client";

import {
  CheckCircle2,
  Edit2,
  KeyRound,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCircle,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Role, StatusUser } from "@/lib/db/schema";
import {
  createUser,
  deleteUser,
  getUserData,
  resetPassword,
  updateUser,
} from "./actions";

export type UserData = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  status: StatusUser;
};

export default function UsersPage() {
  const [data, setData] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    admin: 0,
    konsumen: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [_refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    setIsLoading(true);
    getUserData({
      page: currentPage,
      pageSize,
      searchTerm,
      filterRole,
      filterStatus,
    }).then((res) => {
      const result = res as {
        data: UserData[];
        total: number;
        stats: {
          total: number;
          aktif: number;
          admin: number;
          konsumen: number;
        };
      };
      setData(result.data);
      setTotal(result.total);
      setStats(result.stats);
      setIsLoading(false);
    });
  }, [currentPage, pageSize, searchTerm, filterRole, filterStatus]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleRoleChange = (val: string) => {
    setFilterRole(val);
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
    const data = {
      name: formData.get("name") as string,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as Role,
      status: formData.get("status") as StatusUser,
    };

    if (selectedUser) {
      await updateUser(selectedUser.id, data);
      toast.success("User berhasil diperbarui!");
    } else {
      await createUser(data);
      toast.success("User berhasil ditambahkan! Password default: password");
    }

    triggerRefresh();
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      toast.success("User berhasil dihapus!");

      triggerRefresh();
      closeDeleteModal();
    }
  };

  const handleResetPassword = async (user: UserData) => {
    if (confirm(`Reset password untuk ${user.username} menjadi 'password'?`)) {
      const res = await resetPassword(user.id);
      if (res.success) {
        toast.success("Password berhasil direset!");
        triggerRefresh();
      } else {
        toast.error("Gagal mereset password");
      }
    }
  };

  const openModal = (user: UserData | null = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900">
            Manajemen User
          </h1>
          <p className="text-zinc-500 mt-1">
            Kelola akses dan akun pengguna sistem.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-accent transition-all shadow-lg shadow-primary/20">
          <Plus size={20} />
          Tambah User
        </button>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-sky-50/50 rounded-[24px] border border-sky-100 p-6 shadow-sm group hover:bg-sky-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Total
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {stats.total}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seluruh Pengguna</p>
        </div>

        {/* Aktif */}
        <div className="bg-emerald-50/50 rounded-[24px] border border-emerald-100 p-6 shadow-sm group hover:bg-emerald-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Aktif
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {stats.aktif}
          </p>
          <p className="text-xs text-zinc-500 mt-1">User Aktif</p>
        </div>

        {/* Admin */}
        <div className="bg-purple-50/50 rounded-[24px] border border-purple-100 p-6 shadow-sm group hover:bg-purple-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Shield size={20} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {stats.admin}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Administrator</p>
        </div>

        {/* Konsumen */}
        <div className="bg-amber-50/50 rounded-[24px] border border-amber-100 p-6 shadow-sm group hover:bg-amber-50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <UserCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Konsumen
            </span>
          </div>
          <p className="text-3xl font-heading font-extrabold text-zinc-900">
            {stats.konsumen}
          </p>
          <p className="text-xs text-zinc-500 mt-1">User Konsumen</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar User
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full lg:w-64"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Role</option>
              <option value="KONSUMEN">Konsumen</option>
              <option value="BANK_SAMPAH">Bank Sampah</option>
              <option value="ADMIN">Admin</option>
              <option value="HRD">HRD</option>
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
                  Pengguna
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Role
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
                    colSpan={5}
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
                    colSpan={5}
                    className="px-4 md:px-8 py-12 text-center text-zinc-500">
                    Tidak ada data user ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 uppercase shrink-0">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm md:text-base">
                            {u.name}
                          </p>
                          <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-zinc-600">
                      <span className="truncate max-w-[120px] md:max-w-none block">
                        {u.email}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "HRD"
                              ? "bg-blue-100 text-blue-700"
                              : u.role === "BANK_SAMPAH"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        }`}>
                        <Shield size={12} /> {u.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      {u.status === "AKTIF" ? (
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
                          onClick={() => handleResetPassword(u)}
                          title="Reset Password"
                          className="p-1.5 md:p-2 text-zinc-400 hover:text-amber-600 transition-colors hover:bg-amber-50 rounded-lg">
                          <KeyRound
                            size={16}
                            className="md:w-[18px] md:h-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(u)}
                          className="p-1.5 md:p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2
                            size={16}
                            className="md:w-[18px] md:h-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(u)}
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
              dari <span className="font-bold text-zinc-700">{total}</span> user
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
                {selectedUser ? "Edit User" : "Tambah User Baru"}
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
                    htmlFor="name"
                    className="text-sm font-bold text-zinc-700">
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    required
                    name="name"
                    defaultValue={selectedUser?.name}
                    placeholder="Budi Santoso"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-bold text-zinc-700">
                    Username
                  </label>
                  <input
                    id="username"
                    required
                    name="username"
                    defaultValue={selectedUser?.username}
                    placeholder="budi_s"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-bold text-zinc-700">
                    Email
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    name="email"
                    defaultValue={selectedUser?.email}
                    placeholder="budi@example.com"
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="text-sm font-bold text-zinc-700">
                    Role (Hak Akses)
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={selectedUser?.role || "KONSUMEN"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="KONSUMEN">Konsumen</option>
                    <option value="BANK_SAMPAH">Bank Sampah</option>
                    <option value="ADMIN">Admin</option>
                    <option value="HRD">HRD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-bold text-zinc-700">
                    Status User
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={selectedUser?.status || "AKTIF"}
                    className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20">
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                  </select>
                </div>
              </div>

              {!selectedUser && (
                <p className="mt-6 text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-2">
                  <KeyRound size={16} />
                  Password default untuk user baru adalah{" "}
                  <strong>password</strong>
                </p>
              )}

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
              Hapus User?
            </h3>
            <p className="text-zinc-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus user{" "}
              <span className="font-bold text-zinc-900">
                {selectedUser?.name}
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
