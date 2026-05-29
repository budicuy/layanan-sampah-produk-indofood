"use client";

import {
  Calendar,
  Edit2,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createRawMaterials,
  deleteRawMaterial,
  getRawMaterials,
  updateRawMaterial,
} from "./actions";

interface RawMaterialData {
  id: string;
  periode: Date;
  kategori: string;
  klasifikasi: string;
  beratGr: number;
  beratKg: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function RawMaterialPage() {
  const [materials, setMaterials] = useState<RawMaterialData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<RawMaterialData | null>(null);

  // Edit Form State
  const [editWeightGr, setEditWeightGr] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Form State
  const [addPeriod, setAddPeriod] = useState(""); // "YYYY-MM"
  const [addWeights, setAddWeights] = useState({
    etiketNN: 0,
    etiketGN: 0,
    etiketCN: 0,
    kartonNN: 0,
    kartonGN: 0,
    kartonCN: 0,
    cupCN: 0,
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("ALL");
  const [filterKlasifikasi, setFilterKlasifikasi] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [_refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleKategoriChange = (val: string) => {
    setFilterKategori(val);
    setCurrentPage(1);
  };

  const handleKlasifikasiChange = (val: string) => {
    setFilterKlasifikasi(val);
    setCurrentPage(1);
  };

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRawMaterials({
        page: currentPage,
        pageSize,
        searchTerm,
        filterKategori,
        filterKlasifikasi,
      });
      const result = res as { data: RawMaterialData[]; total: number };
      setMaterials(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data raw material");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterKategori, filterKlasifikasi]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleOpenAddModal = () => {
    // Set to current month by default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setAddPeriod(currentMonth);
    setAddWeights({
      etiketNN: 0,
      etiketGN: 0,
      etiketCN: 0,
      kartonNN: 0,
      kartonGN: 0,
      kartonCN: 0,
      cupCN: 0,
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPeriod) {
      toast.error("Periode bulan dan tahun wajib dipilih");
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await createRawMaterials(addPeriod, addWeights);
      if (res.success) {
        toast.success("Master data raw material berhasil disimpan!");
        setIsAddModalOpen(false);
        triggerRefresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data raw material");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEditModal = (material: RawMaterialData) => {
    setSelectedMaterial(material);
    setEditWeightGr(material.beratGr);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    if (editWeightGr < 0) {
      toast.error("Berat tidak boleh negatif");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updateRawMaterial(selectedMaterial.id, editWeightGr);
      if (res.success) {
        toast.success("Berat raw material berhasil diperbarui!");
        setIsEditModalOpen(false);
        triggerRefresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui data");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenDeleteModal = (material: RawMaterialData) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedMaterial) return;

    try {
      const res = await deleteRawMaterial(selectedMaterial.id);
      if (res.success) {
        toast.success("Baris raw material berhasil dihapus!");
        setIsDeleteModalOpen(false);
        triggerRefresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus data");
    }
  };

  const getPeriodName = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  // Grouping/Rendering variables per page:
  let periodCounter = (currentPage - 1) * pageSize;
  const paginatedProcessedMaterials = materials.map((m, index) => {
    const isFirstInPage = index === 0;
    const prevItem = index > 0 ? materials[index - 1] : null;
    const periodName = getPeriodName(m.periode);
    const isFirstInPeriod =
      isFirstInPage ||
      (prevItem
        ? getPeriodName(m.periode) !== getPeriodName(prevItem.periode)
        : true);
    if (isFirstInPeriod) {
      periodCounter++;
    }
    return {
      ...m,
      periodName,
      isFirstInPeriod,
      periodNumber: periodCounter,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-zinc-900">
            MASTER DATA RAW MATERIAL
          </h1>
          <p className="text-zinc-500 mt-1">
            Kelola data standar berat kemasan produk (Etiket, Karton, Cup) per
            periode bulan/tahun.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-2xl font-bold hover:bg-orange-600 hover:shadow-lg transition-all active:scale-95">
          <Plus size={20} />
          Input Data Baru
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-zinc-50 border border-zinc-200/60 rounded-3xl p-5 flex items-start gap-3 text-zinc-600">
        <Info className="w-5 h-5 mt-0.5 shrink-0 text-orange-500" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold text-zinc-800">Mekanisme Konversi Berat:</p>
          <p>
            Setiap data yang dimasukkan dalam satuan Gram (gr) akan otomatis
            dikonversikan ke dalam satuan Kilogram (kg) dengan pembagian 1000.
            Data dikelompokkan berdasarkan bulan dan tahun periode.
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-zinc-900 font-heading">
            Daftar Berat Standar
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kategori, klasifikasi, periode..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 w-full lg:w-72 focus:outline-none"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => handleKategoriChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              <option value="Etiket">Etiket</option>
              <option value="Karton">Karton</option>
              <option value="Cup">Cup</option>
            </select>
            <select
              value={filterKlasifikasi}
              onChange={(e) => handleKlasifikasiChange(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 text-zinc-700 font-medium cursor-pointer">
              <option value="ALL">Semua Klasifikasi</option>
              <option value="NN">Normal Noodle (NN)</option>
              <option value="GN">Glass Noodle (GN)</option>
              <option value="CN">Cup Noodle (CN)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center w-16">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Periode
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Klasifikasi
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat (gr)
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Berat (kg)
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center w-32">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span>Memuat data raw material...</span>
                    </div>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-500">
                    <div className="text-center py-6 text-zinc-400">
                      <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-zinc-500">
                        Tidak ada data ditemukan
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Coba input data baru atau ubah kata kunci pencarian
                        Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProcessedMaterials.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-6 py-4 text-center text-sm font-bold text-zinc-700">
                      {m.isFirstInPeriod ? m.periodNumber : ""}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-zinc-950">
                      {m.isFirstInPeriod ? m.periodName : ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-800 font-medium">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          m.kategori === "Etiket"
                            ? "bg-sky-50 text-sky-700 border border-sky-100"
                            : m.kategori === "Karton"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                        {m.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-700">
                      {m.klasifikasi === "NN"
                        ? "Normal Noodle (NN)"
                        : m.klasifikasi === "CN"
                          ? "Cup Noodle (CN)"
                          : "Glass Noodle (GN)"}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-zinc-800">
                      {m.beratGr.toLocaleString("id-ID")} gr
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-orange-600 bg-orange-50/20">
                      {m.beratKg.toFixed(4)} kg
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(m)}
                          className="p-2 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all"
                          title="Edit baris berat ini">
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(m)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus baris berat ini">
                          <Trash2 size={16} />
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
        {!loading && totalPages > 1 && (
          <div className="p-5 md:p-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/30">
            <p className="text-sm text-zinc-500">
              Menampilkan{" "}
              <span className="font-bold text-zinc-700">
                {paginatedProcessedMaterials.length}
              </span>{" "}
              dari <span className="font-bold text-zinc-700">{total}</span>{" "}
              baris standar
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

      {/* INPUT DATA BARU MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative border border-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-500 to-red-500" />

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="font-heading font-black text-xl text-zinc-900">
                  Input Master Data Raw Material
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">
                  Periode (Bulan dan Tahun)
                </span>
                <input
                  type="month"
                  required
                  value={addPeriod}
                  onChange={(e) => setAddPeriod(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-zinc-800"
                />
              </div>

              {/* Etiket Grid */}
              <div className="space-y-3 bg-sky-50/20 p-5 rounded-2xl border border-sky-100/50">
                <h4 className="text-xs font-black text-sky-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Kategori: Etiket (gr)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Normal Noodle (NN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.etiketNN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          etiketNN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-zinc-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Glass Noodle (GN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.etiketGN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          etiketGN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-zinc-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Cup Noodle (CN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.etiketCN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          etiketCN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Karton Grid */}
              <div className="space-y-3 bg-amber-50/20 p-5 rounded-2xl border border-amber-100/50">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Kategori: Karton (gr)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Normal Noodle (NN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.kartonNN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          kartonNN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-zinc-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Glass Noodle (GN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.kartonGN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          kartonGN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-zinc-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Cup Noodle (CN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.kartonCN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          kartonCN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Cup Grid */}
              <div className="space-y-3 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/50">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Kategori: Cup (gr)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                      Cup Noodle (CN)
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0"
                      value={addWeights.cupCN}
                      onChange={(e) =>
                        setAddWeights({
                          ...addWeights,
                          cupCN: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5">
                  {submittingAdd ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Data Periode
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-zinc-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 to-red-500" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-black text-lg text-zinc-900">
                Edit Berat Raw Material
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="bg-zinc-50 p-4 rounded-2xl space-y-2 border border-zinc-100 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span className="font-medium">Periode:</span>
                  <span className="font-bold text-zinc-900">
                    {getPeriodName(selectedMaterial.periode)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Kategori:</span>
                  <span className="font-bold text-zinc-900">
                    {selectedMaterial.kategori}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Klasifikasi:</span>
                  <span className="font-bold text-zinc-900">
                    {selectedMaterial.klasifikasi}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-500 block mb-1">
                  Berat Baru (Gram)
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  value={editWeightGr}
                  onChange={(e) => setEditWeightGr(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-850 font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-3 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all">
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-zinc-100 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-lg text-zinc-900 mb-2">
              Hapus Baris Raw Material?
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus data berat raw material untuk
              kategori{" "}
              <span className="font-bold text-zinc-900">
                {selectedMaterial.kategori}
              </span>{" "}
              (
              <span className="font-bold text-zinc-900">
                {selectedMaterial.klasifikasi}
              </span>
              ) periode{" "}
              <span className="font-bold text-zinc-900">
                {getPeriodName(selectedMaterial.periode)}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-2xl transition-all">
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="flex-1 py-3 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-red-600/10">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
