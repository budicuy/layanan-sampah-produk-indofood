"use client";

import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  cairkanPencairan,
  getPencairanAdminList,
  tolakPencairan,
  verifikasiPencairan,
} from "./actions";

type StatusPencairan = "DIAJUKAN" | "DIVERIFIKASI" | "DICAIRKAN" | "DITOLAK";

type PencairanItem = {
  id: string;
  jumlah: number;
  status: StatusPencairan;
  catatan: string | null;
  catatanAdmin: string | null;
  buktiFoto: string | null;
  diajukanAt: Date;
  diverifikasi: Date | null;
  dicairkan: Date | null;
  nasabah: {
    user: { name: string; username: string };
    saldo: number;
  };
};

const STATUS_CONFIG: Record<
  StatusPencairan,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DIAJUKAN: {
    label: "Diajukan",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock size={13} />,
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <AlertCircle size={13} />,
  },
  DICAIRKAN: {
    label: "Dicairkan",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle size={13} />,
  },
  DITOLAK: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle size={13} />,
  },
};

export default function AdminPencairanPage() {
  const [list, setList] = useState<PencairanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<{
    type: "cairkan" | "tolak";
    item: PencairanItem;
  } | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const data = await getPencairanAdminList();
    setList(data as PencairanItem[]);
    setLoading(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Mengompres foto...", { id: "compress" });
    try {
      const originalSizeKB = (file.size / 1024).toFixed(1);

      // Kompresi tahap 1: target 45KB (buffer aman di bawah limit 50KB)
      let compressed = await imageCompression(file, {
        maxSizeMB: 0.045,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.6,
      });

      // Jika masih >48KB, lakukan kompresi ulang lebih agresif
      if (compressed.size > 49152) {
        compressed = await imageCompression(compressed, {
          maxSizeMB: 0.04,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.45,
        });
      }

      // Jika masih >48KB, kompresi terakhir paling agresif
      if (compressed.size > 49152) {
        compressed = await imageCompression(compressed, {
          maxSizeMB: 0.035,
          maxWidthOrHeight: 640,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.3,
        });
      }

      const compressedSizeKB = (compressed.size / 1024).toFixed(1);
      setFoto(compressed);
      setFotoPreview(URL.createObjectURL(compressed));
      setCompressionInfo(`${originalSizeKB}KB → ${compressedSizeKB}KB`);
      toast.success(
        `Foto dikompres: ${originalSizeKB}KB → ${compressedSizeKB}KB`,
        { id: "compress" },
      );
    } catch {
      toast.error("Gagal mengompres foto", { id: "compress" });
    }
  };

  const handleVerifikasi = (item: PencairanItem) => {
    startTransition(async () => {
      try {
        await verifikasiPencairan(item.id, "");
        toast.success("Pencairan berhasil diverifikasi");
        await fetchData();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal memverifikasi");
      }
    });
  };

  const handleTolak = () => {
    if (!activeModal) return;
    startTransition(async () => {
      try {
        await tolakPencairan(activeModal.item.id, catatanAdmin);
        toast.success("Pencairan ditolak");
        setActiveModal(null);
        setCatatanAdmin("");
        await fetchData();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menolak");
      }
    });
  };

  const handleCairkan = () => {
    if (!activeModal) return;
    const formData = new FormData();
    formData.set("id", activeModal.item.id);
    formData.set("catatanAdmin", catatanAdmin);
    if (foto) formData.set("buktiFoto", foto);

    startTransition(async () => {
      try {
        await cairkanPencairan(formData);
        toast.success("Pencairan berhasil dicairkan & saldo dipotong!");
        setActiveModal(null);
        setCatatanAdmin("");
        setFoto(null);
        setFotoPreview(null);
        setCompressionInfo("");
        await fetchData();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mencairkan");
      }
    });
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const stats = {
    diajukan: list.filter((x) => x.status === "DIAJUKAN").length,
    diverifikasi: list.filter((x) => x.status === "DIVERIFIKASI").length,
    dicairkan: list.filter((x) => x.status === "DICAIRKAN").length,
    totalNilai: list
      .filter((x) => x.status === "DICAIRKAN")
      .reduce((s, x) => s + x.jumlah, 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Pencairan Dana Bank Sampah
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Kelola pengajuan pencairan dari nasabah bank sampah
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Menunggu",
            value: stats.diajukan,
            color: "text-amber-600 bg-amber-50",
            icon: <Clock size={18} />,
          },
          {
            label: "Diverifikasi",
            value: stats.diverifikasi,
            color: "text-blue-600 bg-blue-50",
            icon: <AlertCircle size={18} />,
          },
          {
            label: "Dicairkan",
            value: stats.dicairkan,
            color: "text-emerald-600 bg-emerald-50",
            icon: <CheckCircle size={18} />,
          },
          {
            label: "Total Cair",
            value: formatRupiah(stats.totalNilai),
            color: "text-violet-600 bg-violet-50",
            icon: <Banknote size={18} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
            <p className="text-xl font-black text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-bold text-zinc-800">Daftar Pengajuan</h2>
          <button
            type="button"
            onClick={fetchData}
            className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-zinc-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Banknote size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada pengajuan pencairan</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {list.map((item) => {
              const cfg = STATUS_CONFIG[item.status];
              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900">
                        {item.nasabah.user.name}
                      </span>
                      <span className="text-xs text-zinc-400">
                        @{item.nasabah.user.username}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="text-lg font-black text-zinc-900">
                      {formatRupiah(item.jumlah)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(item.diajukanAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {item.catatan && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        "{item.catatan}"
                      </p>
                    )}
                    {item.catatanAdmin && (
                      <p className="text-xs text-blue-600 mt-1">
                        Admin: {item.catatanAdmin}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {item.buktiFoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(item.buktiFoto)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Lihat bukti">
                        <Eye size={16} />
                      </button>
                    )}
                    {item.status === "DIAJUKAN" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleVerifikasi(item)}
                          disabled={isPending}
                          className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                          Verifikasi
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal({ type: "tolak", item });
                            setCatatanAdmin("");
                          }}
                          className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                          Tolak
                        </button>
                      </>
                    )}
                    {item.status === "DIVERIFIKASI" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal({ type: "cairkan", item });
                          setCatatanAdmin("");
                          setFoto(null);
                          setFotoPreview(null);
                          setCompressionInfo("");
                        }}
                        className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                        Cairkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cairkan */}
      {activeModal?.type === "cairkan" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-zinc-900">
              Konfirmasi Pencairan
            </h3>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-zinc-600 mb-1">
                Nasabah: <strong>{activeModal.item.nasabah.user.name}</strong>
              </p>
              <p className="text-2xl font-black text-emerald-700">
                {formatRupiah(activeModal.item.jumlah)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Saldo akan dipotong otomatis setelah konfirmasi
              </p>
            </div>

            {/* Upload foto bukti - WAJIB */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <p className="text-xs font-semibold text-zinc-700">
                  Upload Bukti Transfer
                </p>
                <span className="text-xs font-bold text-red-500">*Wajib</span>
                <span className="text-[10px] text-zinc-400 ml-1">
                  (dikompres ≤50KB)
                </span>
              </div>
              <input
                ref={fileInputRef}
                id="bukti-foto-upload"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
              {fotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400">
                  <Image
                    src={fotoPreview}
                    alt="Preview bukti transfer"
                    width={400}
                    height={200}
                    className="w-full max-h-48 object-cover"
                    unoptimized
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg">
                    {compressionInfo}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      setFotoPreview(null);
                      setCompressionInfo("");
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg">
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-red-200 bg-red-50/30 rounded-xl py-8 flex flex-col items-center gap-2 text-red-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs font-semibold">
                    Klik untuk upload foto bukti (wajib)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Foto akan dikompres otomatis ≤50KB
                  </span>
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">
                Catatan Admin (opsional)
              </p>
              <textarea
                id="catatan-admin-cairkan"
                value={catatanAdmin}
                onChange={(e) => setCatatanAdmin(e.target.value)}
                rows={2}
                placeholder="Tambahkan catatan..."
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
                Batal
              </button>
              <button
                type="button"
                onClick={handleCairkan}
                disabled={isPending || !foto}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {isPending
                  ? "Memproses..."
                  : foto
                    ? "✓ Konfirmasi Cair"
                    : "Upload Foto Dulu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {activeModal?.type === "tolak" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-zinc-900">Tolak Pengajuan</h3>
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">
                Alasan penolakan
              </p>
              <textarea
                id="alasan-tolak"
                value={catatanAdmin}
                onChange={(e) => setCatatanAdmin(e.target.value)}
                rows={3}
                placeholder="Tuliskan alasan penolakan..."
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
                Batal
              </button>
              <button
                type="button"
                onClick={handleTolak}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60">
                {isPending ? "Memproses..." : "Tolak Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bukti pencairan"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedPhoto(null)}>
          <div className="max-w-lg w-full">
            <Image
              src={selectedPhoto}
              alt="Bukti pencairan dana"
              width={600}
              height={400}
              className="w-full rounded-2xl shadow-2xl"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="mt-4 w-full py-2 bg-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/30">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
