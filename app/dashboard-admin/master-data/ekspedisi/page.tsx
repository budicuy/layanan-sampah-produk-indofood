"use client";

import {
  Edit2,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createEkpedisi,
  deleteEkpedisi,
  getEkpedisiData,
  updateEkpedisi,
} from "./actions";

export type EkpedisiData = {
  id: string;
  nama: string;
  noTelp: string;
  alamat: string;
};

export default function EkpedisiPage() {
  const [data, setData] = useState<EkpedisiData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEkpedisi, setSelectedEkpedisi] = useState<EkpedisiData | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [_refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    setIsLoading(true);
    getEkpedisiData({
      page: currentPage,
      pageSize,
      searchTerm,
    }).then((res) => {
      setData(res.ekpedisi as EkpedisiData[]);
      setTotal(res.total);
      setTotalRecords(res.totalRecords);
      setIsLoading(false);
    });
  }, [currentPage, pageSize, searchTerm]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nama: formData.get("nama") as string,
      noTelp: formData.get("noTelp") as string,
      alamat: formData.get("alamat") as string,
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

    triggerRefresh();
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

      triggerRefresh();
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
            {totalRecords}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seluruh Armada</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Ekspedisi
          </h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari ekspedisi..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Nama Ekspedisi
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kontak
                </th>
                <th className="px-4 md:px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Alamat
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
                    Tidak ada data ekspedisi ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((e: EkpedisiData) => (
                  <tr
                    key={e.id}
                    className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-600 shrink-0">
                          <Truck
                            size={18}
                            className="w-4 h-4 md:w-[18px] md:h-[18px]"
                          />
                        </div>
                        <p className="font-bold text-zinc-900 text-sm md:text-base">
                          {e.nama}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[120px] md:max-w-none">
                          {e.noTelp}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm text-zinc-600">
                      <div className="flex items-start gap-2 max-w-[200px] md:max-w-xs">
                        <MapPin
                          size={14}
                          className="text-zinc-400 mt-0.5 shrink-0"
                        />
                        <p className="line-clamp-2">{e.alamat}</p>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(e)}
                          className="p-1.5 md:p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-blue-50 rounded-lg">
                          <Edit2
                            size={16}
                            className="md:w-[18px] md:h-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(e)}
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
              armada ekspedisi
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
                    htmlFor="nama"
                    className="text-sm font-bold text-zinc-700">
                    Nama Ekspedisi
                  </label>
                  <input
                    id="nama"
                    required
                    name="nama"
                    defaultValue={selectedEkpedisi?.nama}
                    placeholder="Contoh: Kurir ABC"
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
