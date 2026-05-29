"use client";

import imageCompression from "browser-image-compression";
import {
  Camera,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Info,
  Loader2,
  PackageCheck,
  Recycle,
  Send,
  Trash2,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { JenisSampah } from "@/lib/db/schema";
import {
  getSetorSampahKonsumenData,
  konfirmasiSerahTerima,
  submitSetorLangsung,
  submitSetorSampah,
} from "./actions";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Helper to convert File to base64
const fileToBase64 = (
  file: File,
): Promise<{ base64: string; mime: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(",");
      const base64 = result.substring(commaIdx + 1);
      resolve({ base64, mime: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper to compress and convert file
const compressAndGetBase64 = async (file: File) => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };
  try {
    const compressed = await imageCompression(file, options);
    return await fileToBase64(compressed);
  } catch (err) {
    console.error("Compression failed, using original file:", err);
    return await fileToBase64(file);
  }
};

const STATUS_STEPS: {
  key: string;
  label: string;
  desc: string;
}[] = [
    {
      key: "MENUNGGU_VERIFIKASI",
      label: "Menunggu Verifikasi",
      desc: "Admin sedang meninjau data setoran Anda",
    },
    {
      key: "TERVERIFIKASI",
      label: "Terverifikasi",
      desc: "Data valid, menunggu penjemputan",
    },
    {
      key: "DALAM_PENJEMPUTAN",
      label: "Dalam Penjemputan",
      desc: "Kurir sedang dalam perjalanan ke lokasi Anda",
    },
    {
      key: "SUDAH_DISERAHKAN",
      label: "Sudah Diserahkan",
      desc: "Sampah telah diserahkan kepada kurir",
    },
    {
      key: "SAMPAH_DITERIMA",
      label: "Sampah Diterima",
      desc: "Sampah telah tiba di pusat pengolahan",
    },
    {
      key: "SELESAI",
      label: "Selesai",
      desc: "Poin telah dikreditkan ke akun Anda",
    },
  ];

function getStepIndex(status: string): number {
  if (status === "DITOLAK") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    MENUNGGU_VERIFIKASI: {
      label: "Menunggu Verifikasi",
      cls: "bg-amber-100 text-amber-700",
    },
    TERVERIFIKASI: {
      label: "Terverifikasi",
      cls: "bg-blue-100 text-blue-700",
    },
    DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
    DALAM_PENJEMPUTAN: {
      label: "Dalam Penjemputan",
      cls: "bg-purple-100 text-purple-700",
    },
    SUDAH_DISERAHKAN: {
      label: "Sudah Diserahkan",
      cls: "bg-indigo-100 text-indigo-700",
    },
    SAMPAH_DITERIMA: {
      label: "Sampah Diterima",
      cls: "bg-teal-100 text-teal-700",
    },
    SELESAI: { label: "Selesai ✓", cls: "bg-green-100 text-green-700" },
  };

  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

function BtnKonfirmasiSerahTerima({
  setorSampahId,
  onSuccess,
}: {
  setorSampahId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKonfirmasi() {
    if (
      !confirm(
        "Apakah Anda sudah menyerahkan sampah kepada kurir? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await konfirmasiSerahTerima(setorSampahId);
      if (res && !res.success) {
        setError(res.error || "Terjadi kesalahan");
      } else {
        setDone(true);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
        <CheckCircle size={16} />
        Sudah diserahkan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="button"
        onClick={handleKonfirmasi}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-60 transition-all active:scale-95">
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <PackageCheck size={14} />
        )}
        {loading ? "Memproses..." : "Konfirmasi Sudah Diserahkan"}
      </button>
    </div>
  );
}

function FormSetorSampah({
  defaultAlamat,
  onSuccess,
}: {
  defaultAlamat?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");

  const [form, setForm] = useState({
    jenisSampah: "PLASTIK" as JenisSampah,
    beratEstimasi: "",
    keterangan: "",
    alamatPenjemputan: defaultAlamat ?? "",
  });

  const [scaleFile, setScaleFile] = useState<File | null>(null);
  const [scalePreview, setScalePreview] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scaleFile) {
      setError("Foto timbangan wajib diunggah.");
      return;
    }
    if (proofFiles.length < 1) {
      setError("Minimal 1 foto bukti tambahan wajib diunggah.");
      return;
    }
    if (proofFiles.length > 4) {
      setError("Maksimal 4 foto bukti tambahan diperbolehkan.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisStatus("Menyiapkan foto...");
    try {
      // 1. Compress scale + proof images IN PARALLEL
      const scaleRes = await compressAndGetBase64(scaleFile);
      setAnalysisStatus(`Kompresi ${proofFiles.length} foto bukti...`);
      const proofResults = await Promise.all(
        proofFiles.map((file) => compressAndGetBase64(file)),
      );
      const proofBase64List = proofResults.map((r) => r.base64);
      const proofMimeList = proofResults.map((r) => r.mime);

      // 2. AI VALIDATION FIRST - Jika gagal, langsung error (stop di sini)
      setAnalysisStatus("Validasi foto timbangan dengan AI...");
      const res = await submitSetorSampah({
        jenisSampah: form.jenisSampah,
        beratEstimasi: Number(form.beratEstimasi),
        keterangan: form.keterangan || undefined,
        alamatPenjemputan: form.alamatPenjemputan,
        gambarTimbanganBase64: scaleRes.base64,
        gambarTimbanganMime: scaleRes.mime,
        gambarBuktiBase64List: proofBase64List,
        gambarBuktiMimeList: proofMimeList,
      });

      if (res && !res.success) {
        setError(res.error || "Terjadi kesalahan");
      } else {
        setSuccess(true);
        setForm({
          jenisSampah: "PLASTIK",
          beratEstimasi: "",
          keterangan: "",
          alamatPenjemputan: defaultAlamat ?? "",
        });
        setScaleFile(null);
        setScalePreview(null);
        setProofFiles([]);
        setProofPreviews([]);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
      setAnalysisStatus("");
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Recycle className="text-green-600 w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-green-800">
          Pengajuan Berhasil!
        </h3>
        <p className="text-green-700 text-sm">
          Data setor sampah Anda sudah dikirim dan divalidasi. Tunggu verifikasi
          dari admin.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors cursor-pointer">
          Ajukan Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Jenis Sampah */}
      <div>
        <label
          htmlFor="jenisSampah"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Jenis Sampah <span className="text-red-500">*</span>
        </label>
        <select
          id="jenisSampah"
          value={form.jenisSampah}
          onChange={(e) =>
            setForm({ ...form, jenisSampah: e.target.value as JenisSampah })
          }
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required>
          <option value="PLASTIK">Plastik</option>
          <option value="KARTON">Karton / Kardus</option>
          <option value="PAPER_CUP">Paper Cup</option>
        </select>
      </div>

      {/* Berat Estimasi */}
      <div>
        <label
          htmlFor="beratEstimasi"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Estimasi Berat (kg) <span className="text-red-500">*</span>
        </label>
        <input
          id="beratEstimasi"
          type="number"
          min="0.1"
          step="0.1"
          value={form.beratEstimasi}
          onChange={(e) => setForm({ ...form, beratEstimasi: e.target.value })}
          placeholder="Contoh: 2.5"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required
        />
      </div>

      {/* Alamat Penjemputan */}
      <div>
        <label
          htmlFor="alamatPenjemputan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Alamat Penjemputan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="alamatPenjemputan"
          value={form.alamatPenjemputan}
          onChange={(e) =>
            setForm({ ...form, alamatPenjemputan: e.target.value })
          }
          placeholder="Masukkan alamat lengkap untuk penjemputan..."
          rows={3}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          required
        />
      </div>

      {/* Keterangan */}
      <div>
        <label
          htmlFor="keterangan"
          className="block text-sm font-bold text-zinc-700 mb-2">
          Keterangan Tambahan{" "}
          <span className="text-zinc-400 font-normal">(opsional)</span>
        </label>
        <textarea
          id="keterangan"
          value={form.keterangan}
          onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          placeholder="Catatan tambahan untuk petugas..."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Upload Gambar Timbangan (Wajib) */}
      <div className="space-y-2">
        <p className="block text-sm font-bold text-zinc-700">
          Foto Timbangan (Wajib) <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Ambil foto timbangan yang menampilkan angka berat secara jelas. Foto
          ini akan dianalisis otomatis oleh AI.
        </p>

        {scalePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video group bg-zinc-50 flex items-center justify-center">
            {/* biome-ignore lint/performance/noImgElement: Client-side file preview */}
            <img
              src={scalePreview}
              alt="Preview Timbangan"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setScaleFile(null);
                setScalePreview(null);
              }}
              className="absolute top-3 right-3 bg-red-50 text-white p-2 rounded-xl hover:bg-red-650 transition-colors shadow-md cursor-pointer">
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-6 bg-zinc-50 hover:bg-zinc-100/50 cursor-pointer transition-colors text-center group">
            <Camera className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors mb-2" />
            <span className="text-xs font-bold text-zinc-700">
              Pilih Foto Timbangan
            </span>
            <span className="text-[10px] text-zinc-400 mt-1">
              Format JPG, PNG (Maks 10MB)
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setScaleFile(file);
                  setScalePreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
        )}
      </div>

      {/* Upload Foto Bukti Tambahan (Wajib: 1 - 4 Foto) */}
      <div className="space-y-2">
        <p className="block text-sm font-bold text-zinc-700">
          Foto Bukti Sampah Tambahan <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Unggah foto sampah Anda dari sudut lain sebagai bukti fisik tambahan
          (unggah 1 sampai 4 foto).
        </p>

        {/* Thumbnail Preview Grid */}
        {proofPreviews.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {proofPreviews.map((src, index) => (
              <div
                key={src}
                className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
                {/* biome-ignore lint/performance/noImgElement: Client-side file preview */}
                <img
                  src={src}
                  alt={`Preview Bukti ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedFiles = [...proofFiles];
                    const updatedPreviews = [...proofPreviews];
                    updatedFiles.splice(index, 1);
                    updatedPreviews.splice(index, 1);
                    setProofFiles(updatedFiles);
                    setProofPreviews(updatedPreviews);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg hover:bg-red-650 transition-colors shadow-xs cursor-pointer">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {proofFiles.length < 4 && (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-4 bg-zinc-50 hover:bg-zinc-100/50 cursor-pointer transition-colors text-center group">
            <Upload className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors mb-1.5" />
            <span className="text-xs font-bold text-zinc-700">
              Tambah Foto Bukti
            </span>
            <span className="text-[9px] text-zinc-400 mt-0.5">
              Minimal 1 gambar, maksimal 4 gambar ({proofFiles.length}/4)
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const remainingSlots = 4 - proofFiles.length;
                const filesToAdd = files.slice(0, remainingSlots);

                if (filesToAdd.length > 0) {
                  const updatedFiles = [...proofFiles, ...filesToAdd];
                  const updatedPreviews = [
                    ...proofPreviews,
                    ...filesToAdd.map((f) => URL.createObjectURL(f)),
                  ];
                  setProofFiles(updatedFiles);
                  setProofPreviews(updatedPreviews);
                }
              }}
            />
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <div className="flex flex-col items-start gap-0">
              <span>Memproses...</span>
              {analysisStatus && (
                <span className="text-xs opacity-80">{analysisStatus}</span>
              )}
            </div>
          </>
        ) : (
          <>
            <Recycle size={16} />
            Daftarkan Setoran
          </>
        )}
      </button>
    </form>
  );
}

function FormSetorLangsung({
  onBack,
  onSuccess,
  nasabah,
  riwayat = [],
}: {
  onBack: () => void;
  onSuccess: () => void;
  nasabah: { poin: number } | null;
  riwayat?: SetorSampah[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [form, setForm] = useState({
    jenisSampah: "PLASTIK" as JenisSampah,
    beratEstimasi: "",
    keterangan: "",
  });

  const [scaleFile, setScaleFile] = useState<File | null>(null);
  const [scalePreview, setScalePreview] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scaleFile) {
      setError("Foto timbangan wajib diunggah.");
      return;
    }
    if (proofFiles.length < 1) {
      setError("Minimal 1 foto bukti tambahan wajib diunggah.");
      return;
    }
    if (proofFiles.length > 4) {
      setError("Maksimal 4 foto bukti tambahan diperbolehkan.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisStatus("Menyiapkan foto...");
    try {
      // 1. Compress scale + proof images IN PARALLEL
      const scaleRes = await compressAndGetBase64(scaleFile);
      setAnalysisStatus(`Kompresi ${proofFiles.length} foto bukti...`);
      const proofResults = await Promise.all(
        proofFiles.map((file) => compressAndGetBase64(file)),
      );
      const proofBase64List = proofResults.map((r) => r.base64);
      const proofMimeList = proofResults.map((r) => r.mime);

      // 2. AI VALIDATION FIRST - Jika gagal, langsung error (stop di sini)
      setAnalysisStatus("Validasi foto timbangan dengan AI...");
      const res = await submitSetorLangsung({
        jenisSampah: form.jenisSampah,
        beratEstimasi: Number(form.beratEstimasi),
        keterangan: form.keterangan || undefined,
        gambarTimbanganBase64: scaleRes.base64,
        gambarTimbanganMime: scaleRes.mime,
        gambarBuktiBase64List: proofBase64List,
        gambarBuktiMimeList: proofMimeList,
      });

      if (res && !res.success) {
        setError(res.error || "Terjadi kesalahan");
      } else {
        setSuccess(true);
        setForm({ jenisSampah: "PLASTIK", beratEstimasi: "", keterangan: "" });
        setScaleFile(null);
        setScalePreview(null);
        setProofFiles([]);
        setProofPreviews([]);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
      setAnalysisStatus("");
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button + Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1.5 group mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 w-fit cursor-pointer">
          <span className="group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>{" "}
          Kembali ke Pilihan Metode
        </button>
        <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
          Setor{" "}
          <span className="text-zinc-650 font-bold">Langsung ke Pusat</span>
        </h1>
        <p className="text-zinc-500 mt-0.5 text-xs">
          Input data sampah yang akan Anda bawa langsung ke pusat SICUAN.
        </p>
      </div>

      <div className="space-y-4">
        {/* Saldo + Info */}
        <div className="space-y-4">
          {nasabah && (
            <div className="bg-zinc-950 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                  Poin Tabungan Anda
                </p>
                <p className="text-xl font-heading font-black mt-0.5">
                  {nasabah.poin} Poin
                </p>
              </div>
              <Wallet size={28} className="text-white/20 relative z-10" />
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          )}

          {/* Info panduan */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/80">
            <h3 className="font-bold text-zinc-800 text-xs mb-3 flex items-center gap-1.5">
              <Info size={14} className="text-zinc-500" />
              Panduan Setor Langsung
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  n: "1",
                  t: "Isi Formulir",
                  d: "Isi jenis sampah dan estimasi berat Anda",
                },
                {
                  n: "2",
                  t: "Datang ke Pusat",
                  d: "Bawa sampah ke titik drop-off SICUAN kami",
                },
                {
                  n: "3",
                  t: "Timbang & Verifikasi",
                  d: "Petugas akan menimbang dan memverifikasi sampah Anda",
                },
                {
                  n: "4",
                  t: "Poin Masuk",
                  d: "Poin dikreditkan setelah proses selesai",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-2.5 items-start">
                  <div className="w-5.5 h-5.5 rounded-full bg-zinc-200 text-zinc-650 flex items-center justify-center font-bold text-[9px] shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700 text-[11px]">{s.t}</p>
                    <p className="text-zinc-400 text-[9px] mt-0.5 leading-tight">
                      {s.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center">
              <Recycle className="text-zinc-500" size={16} />
            </div>
            Data Sampah Anda
          </h2>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-green-800">
                Berhasil Diajukan!
              </h3>
              <p className="text-green-700 text-xs leading-relaxed">
                Data Anda sudah tercatat dan divalidasi. Segera bawa sampah Anda
                ke pusat Bank Sampah.
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="flex-1 px-3 py-2 border border-green-200 text-green-700 rounded-xl font-bold text-[10px] hover:bg-green-100 transition-colors cursor-pointer">
                  Ajukan Lagi
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-xl font-bold text-[10px] hover:bg-green-700 transition-colors cursor-pointer">
                  Kembali ke Menu
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs whitespace-pre-wrap">
                  {error}
                </div>
              )}

              {!nasabah && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={14} />
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Profil nasabah Anda belum terdaftar. Hubungi admin terlebih
                    dahulu.
                  </p>
                </div>
              )}

              {/* Jenis Sampah */}
              <div>
                <label
                  htmlFor="ls-jenisSampah"
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Jenis Sampah <span className="text-red-500">*</span>
                </label>
                <select
                  id="ls-jenisSampah"
                  value={form.jenisSampah}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jenisSampah: e.target.value as JenisSampah,
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required>
                  <option value="PLASTIK">Plastik</option>
                  <option value="KARTON">Karton / Kardus</option>
                  <option value="PAPER_CUP">Paper Cup</option>
                </select>
              </div>

              {/* Berat Estimasi */}
              <div>
                <label
                  htmlFor="ls-beratEstimasi"
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Estimasi Berat (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ls-beratEstimasi"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.beratEstimasi}
                  onChange={(e) =>
                    setForm({ ...form, beratEstimasi: e.target.value })
                  }
                  placeholder="Contoh: 2.5"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Berat aktual akan ditimbang oleh petugas di lokasi.
                </p>
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="ls-keterangan"
                  className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Keterangan Tambahan{" "}
                  <span className="text-zinc-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  id="ls-keterangan"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  placeholder="Catatan tambahan untuk petugas..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Upload Gambar Timbangan (Wajib) */}
              <div className="space-y-2">
                <p className="block text-xs font-bold text-zinc-700">
                  Foto Timbangan (Wajib) <span className="text-red-500">*</span>
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Ambil foto timbangan yang menampilkan angka berat secara
                  jelas. Foto ini akan dianalisis otomatis oleh AI.
                </p>

                {scalePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video group bg-zinc-50 flex items-center justify-center">
                    {/* biome-ignore lint/performance/noImgElement: Client-side file preview */}
                    <img
                      src={scalePreview}
                      alt="Preview Timbangan"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScaleFile(null);
                        setScalePreview(null);
                      }}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl hover:bg-red-650 transition-colors shadow-md cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-6 bg-zinc-50 hover:bg-zinc-100/50 cursor-pointer transition-colors text-center group">
                    <Camera className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors mb-2" />
                    <span className="text-xs font-bold text-zinc-700">
                      Pilih Foto Timbangan
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Format JPG, PNG (Maks 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setScaleFile(file);
                          setScalePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Upload Foto Bukti Tambahan (Wajib: 1 - 4 Foto) */}
              <div className="space-y-2">
                <p className="block text-xs font-bold text-zinc-700">
                  Foto Bukti Sampah Tambahan{" "}
                  <span className="text-red-500">*</span>
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Unggah foto sampah Anda dari sudut lain sebagai bukti fisik
                  tambahan (unggah 1 sampai 4 foto).
                </p>

                {/* Thumbnail Preview Grid */}
                {proofPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {proofPreviews.map((src, index) => (
                      <div
                        key={src}
                        className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
                        {/* biome-ignore lint/performance/noImgElement: Client-side file preview */}
                        <img
                          src={src}
                          alt={`Preview Bukti ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFiles = [...proofFiles];
                            const updatedPreviews = [...proofPreviews];
                            updatedFiles.splice(index, 1);
                            updatedPreviews.splice(index, 1);
                            setProofFiles(updatedFiles);
                            setProofPreviews(updatedPreviews);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg hover:bg-red-650 transition-colors shadow-xs cursor-pointer">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {proofFiles.length < 4 && (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-primary/50 rounded-2xl p-4 bg-zinc-50 hover:bg-zinc-100/50 cursor-pointer transition-colors text-center group">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors mb-1.5" />
                    <span className="text-xs font-bold text-zinc-700">
                      Tambah Foto Bukti
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-0.5">
                      Minimal 1 gambar, maksimal 4 gambar ({proofFiles.length}
                      /4)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remainingSlots = 4 - proofFiles.length;
                        const filesToAdd = files.slice(0, remainingSlots);

                        if (filesToAdd.length > 0) {
                          const updatedFiles = [...proofFiles, ...filesToAdd];
                          const updatedPreviews = [
                            ...proofPreviews,
                            ...filesToAdd.map((f) => URL.createObjectURL(f)),
                          ];
                          setProofFiles(updatedFiles);
                          setProofPreviews(updatedPreviews);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !nasabah}
                className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-zinc-950 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <div className="flex flex-col items-start gap-0">
                      <span>Memproses...</span>
                      {analysisStatus && (
                        <span className="text-[10px] opacity-80">
                          {analysisStatus}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Recycle size={14} />
                    Daftarkan Setoran
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Riwayat Setor Langsung */}
      {riwayat.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-1.5">
            <Recycle size={16} className="text-zinc-400" />
            Riwayat Setor Langsung
          </h2>
          <div className="space-y-2.5">
            {riwayat.slice(0, 3).map((item) => {
              let typeLabel = "Plastik";
              let typeCls = "bg-red-50 text-red-500";
              if (item.jenisSampah === "KARTON") {
                typeLabel = "Karton";
                typeCls = "bg-orange-50 text-orange-500";
              } else if (item.jenisSampah === "PAPER_CUP") {
                typeLabel = "Paper Cup";
                typeCls = "bg-blue-50 text-blue-500";
              }

              const statusMap: Record<string, { label: string; cls: string }> =
              {
                MENUNGGU_VERIFIKASI: {
                  label: "Menunggu",
                  cls: "bg-amber-100 text-amber-700",
                },
                TERVERIFIKASI: {
                  label: "Terverifikasi",
                  cls: "bg-blue-100 text-blue-700",
                },
                DITOLAK: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
                DALAM_PENJEMPUTAN: {
                  label: "Penjemputan",
                  cls: "bg-purple-100 text-purple-700",
                },
                SUDAH_DISERAHKAN: {
                  label: "Diserahkan",
                  cls: "bg-indigo-100 text-indigo-700",
                },
                SAMPAH_DITERIMA: {
                  label: "Diterima",
                  cls: "bg-teal-100 text-teal-700",
                },
                SELESAI: {
                  label: "Selesai ✓",
                  cls: "bg-green-100 text-green-700",
                },
              };
              const { label, cls } = statusMap[item.status];

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-zinc-100/80 rounded-xl p-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeCls}`}>
                      <Recycle size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">
                        {typeLabel} · {item.beratEstimasi} kg
                        {item.beratAktual != null && (
                          <span className="text-zinc-600 font-bold">
                            {" "}
                            → {item.beratAktual} kg
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${cls}`}>
                      {label}
                    </span>
                    {item.totalPoin != null && (
                      <span className="text-[10px] font-bold text-green-600">
                        +{item.totalPoin} poin
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Ekpedisi = {
  noTelp: string;
  alamat: string;
};

type SetorSampah = {
  id: string;
  jenisSampah: JenisSampah;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
  beratEstimasi: number;
  beratAktual: number | null;
  keterangan: string | null;
  status: string;
  catatanAdmin: string | null;
  verifiedBy: string | null;
  ekpedisi: Ekpedisi | null;
  totalPoin: number | null;
  createdAt: Date;
};

type Nasabah = {
  id: string;
  alamat: string;
  poin: number;
  setorSampah: SetorSampah[];
};

export default function SetorSampahPage() {
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"MENU" | "EKSPEDISI" | "LANGSUNG">("MENU");

  const fetchData = useCallback(async () => {
    try {
      const res = await getSetorSampahKonsumenData();
      if (res.nasabah) {
        const combinedSetor: SetorSampah[] = [
          ...(res.setorLangsung || []).map((s) => ({
            ...s,
            jenisSetor: "LANGSUNG" as const,
            ekpedisi: null,
          })),
          ...(res.setorEkspedisi || []).map((s) => ({
            ...s,
            jenisSetor: "EKSPEDISI" as const,
            ekpedisi: s.ekpedisi
              ? { noTelp: s.ekpedisi.noTelp, alamat: s.ekpedisi.alamat }
              : null,
          })),
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setNasabah({
          id: res.nasabah.id,
          alamat: res.nasabah.alamat || "",
          poin: res.nasabah.poin,
          setorSampah: combinedSetor,
        });
      }
    } catch (_e) {
      // Ignored or handle unauth
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (view === "MENU") {
    return (
      <div className="py-2 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-left mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Pilih Langkah Hijau Anda
          </div>
          <h1 className="text-2xl font-heading font-black text-zinc-900 leading-tight">
            Bagaimana Anda ingin{" "}
            <span className="text-primary">Setor Sampah?</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-xs leading-relaxed">
            Pilih metode yang paling nyaman bagi Anda untuk berkontribusi
            menjaga bumi.
          </p>
        </div>

        <div className="space-y-4 w-full">
          {/* Opsi Setor Langsung */}
          <button
            type="button"
            onClick={() => setView("LANGSUNG")}
            className="relative group flex flex-col w-full text-left bg-white border-2 border-zinc-200 p-6 rounded-3xl transition-all hover:border-zinc-300 hover:shadow-lg overflow-hidden cursor-pointer">
            <div className="mb-4 relative">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                <Recycle className="text-zinc-600 w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-2 bg-zinc-100/50 rounded-2xl blur-lg z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10 w-full">
              <h3 className="text-base font-black text-zinc-900 mb-1 group-hover:text-zinc-700 transition-colors">
                Setor Langsung ke Pusat
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                Datang langsung ke titik drop-off kami. Cocok untuk Anda yang
                ingin menyetor tanpa menunggu jadwal penjemputan.
              </p>

              <div className="space-y-2 mb-2">
                {[
                  "Tanpa Biaya Penjemputan",
                  "Proses Lebih Cepat",
                  "Tidak Perlu Jadwal",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-800 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={11} className="text-zinc-500" />
                    </div>
                    <span className="text-xs font-semibold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 w-full relative z-10">
              <div className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] group-hover:shadow-md">
                <span>Input Data Sampah</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-zinc-100/30 rounded-full blur-2xl group-hover:bg-zinc-200/30 transition-all duration-700" />
          </button>

          {/* Opsi Setor Via Ekspedisi - Creative Active State */}
          <button
            type="button"
            onClick={() => setView("EKSPEDISI")}
            className="relative group flex flex-col w-full text-left bg-white border-2 border-zinc-200 p-6 rounded-3xl transition-all hover:border-primary/30 hover:shadow-lg overflow-hidden cursor-pointer">
            {/* Top Badge */}
            <div className="absolute top-4 right-4">
              <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black tracking-wider uppercase">
                Paling Praktis
              </div>
            </div>

            <div className="mb-4 relative">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                <Send className="text-primary w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-lg z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex-1 relative z-10 w-full">
              <h3 className="text-base font-black text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                Layanan Jemput Ekspedisi
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-4 group-hover:text-zinc-650 transition-colors">
                Duduk santai di rumah, kurir profesional kami yang akan datang
                mengambil sampah ke depan pintu Anda.
              </p>

              <div className="space-y-2 mb-2">
                {[
                  "Jadwal Penjemputan Fleksibel",
                  "Tracking Kurir Real-time",
                  "Hemat Waktu & Tenaga",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-800 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CheckCircle2 size={11} />
                    </div>
                    <span className="text-xs font-semibold">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 w-full relative z-10">
              <div className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] group-hover:bg-primary/95 group-hover:shadow-md">
                <span>Mulai Ajukan Sekarang</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
          </button>
        </div>
      </div>
    );
  }

  if (view === "LANGSUNG") {
    const riwayatLangsung =
      nasabah?.setorSampah.filter((s) => s.jenisSetor === "LANGSUNG") ?? [];
    return (
      <FormSetorLangsung
        onBack={() => setView("MENU")}
        onSuccess={fetchData}
        nasabah={nasabah}
        riwayat={riwayatLangsung}
      />
    );
  }

  const activeEkspedisi = nasabah?.setorSampah.find(
    (item) =>
      item.jenisSetor === "EKSPEDISI" &&
      item.status !== "SELESAI" &&
      item.status !== "DITOLAK",
  );

  if (activeEkspedisi) {
    const stepIdx = getStepIndex(activeEkspedisi.status);

    let typeLabel = "Plastik";
    let typeCls = "bg-red-50 text-red-500";
    if (activeEkspedisi.jenisSampah === "KARTON") {
      typeLabel = "Karton";
      typeCls = "bg-orange-50 text-orange-500";
    } else if (activeEkspedisi.jenisSampah === "PAPER_CUP") {
      typeLabel = "Paper Cup";
      typeCls = "bg-blue-50 text-blue-500";
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <button
            type="button"
            onClick={() => setView("MENU")}
            className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 w-fit cursor-pointer">
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>{" "}
            Kembali ke Pilihan Metode
          </button>
          <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
            Setoran Ekspedisi{" "}
            <span className="text-primary">Sedang Berlangsung</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-xs leading-relaxed">
            Anda memiliki pengiriman sampah via kurir yang sedang berjalan.
            Selesaikan proses ini terlebih dahulu sebelum mengajukan setoran
            baru.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-5 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeCls}`}>
                <Recycle size={18} />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">
                  {typeLabel} · {activeEkspedisi.beratEstimasi} kg
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Diajukan pada{" "}
                  {new Date(activeEkspedisi.createdAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
            <StatusBadge status={activeEkspedisi.status} />
          </div>

          {/* Progress Tracker */}
          <div className="py-2">
            <p className="text-xs font-bold text-zinc-700 mb-4 text-center">
              Progres Pengiriman
            </p>
            <div className="flex items-start gap-0">
              {STATUS_STEPS.map((step, idx) => {
                const done = stepIdx >= idx;
                const current = stepIdx === idx;
                const isLast = idx === STATUS_STEPS.length - 1;

                return (
                  <div
                    key={step.key}
                    className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-center w-full">
                      {/* Left line */}
                      <div
                        className={`flex-1 h-0.5 ${idx === 0 ? "invisible" : done ? "bg-primary" : "bg-zinc-200"}`}
                      />
                      {/* Circle Dot */}
                      {done ? (
                        <CheckCircle2
                          size={16}
                          className={`shrink-0 ${current ? "text-amber-500 animate-pulse" : "text-primary"}`}
                        />
                      ) : (
                        <Circle size={16} className="shrink-0 text-zinc-300" />
                      )}
                      {/* Right line */}
                      <div
                        className={`flex-1 h-0.5 ${isLast ? "invisible" : done && stepIdx > idx ? "bg-primary" : "bg-zinc-200"}`}
                      />
                    </div>
                    <p
                      className={`text-[8px] text-center leading-tight px-0.5 font-bold mt-1 ${done ? "text-zinc-800" : "text-zinc-450"}`}>
                      {step.label
                        .replace("Menunggu ", "")
                        .replace("Dalam ", "")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Info */}
          {activeEkspedisi.ekpedisi && (
            <div className="p-4 bg-zinc-50 rounded-2xl text-xs text-zinc-650 space-y-1 border border-zinc-200">
              <p className="font-bold text-zinc-800 flex items-center gap-1.5">
                <Truck size={14} className="text-zinc-500" />
                Informasi Kurir Penjemput
              </p>
              <p className="pl-5">
                <span className="text-zinc-400">Nama/Alamat:</span>{" "}
                {activeEkspedisi.ekpedisi.alamat}
              </p>
              <p className="pl-5">
                <span className="text-zinc-400">No. Telepon:</span>{" "}
                {activeEkspedisi.ekpedisi.noTelp}
              </p>
            </div>
          )}

          {/* Action button if hand over is pending */}
          {activeEkspedisi.status === "DALAM_PENJEMPUTAN" && (
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-100">
                <Clock size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Kurir Sedang Menuju ke Lokasi Anda
                  </p>
                  <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                    Serahkan sampah Anda kepada kurir saat tiba, lalu
                    konfirmasikan penyerahan dengan menekan tombol di bawah.
                  </p>
                </div>
              </div>
              <BtnKonfirmasiSerahTerima
                setorSampahId={activeEkspedisi.id}
                onSuccess={fetchData}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setView("MENU")}
            className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group mb-3 px-2 py-1 rounded-lg hover:bg-zinc-100 w-fit">
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>{" "}
            Kembali ke Pilihan Metode
          </button>
          <h1 className="text-xl font-heading font-black text-zinc-900 tracking-tight">
            Layanan <span className="text-primary">Jemput Ekspedisi</span>
          </h1>
          <p className="text-zinc-500 mt-0.5 text-xs">
            Atur jadwal penjemputan sampah Anda dengan mudah.
          </p>
        </div>
      </div>

      {/* Saldo Banner */}
      {nasabah && (
        <div className="bg-primary rounded-2xl p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">
              Poin Tabungan Anda
            </p>
            <p className="text-xl font-heading font-black mt-0.5">
              {nasabah.poin} Poin
            </p>
          </div>
          <Wallet size={28} className="text-white/20 relative z-10" />
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      )}

      {!nasabah && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold text-amber-850 text-xs">
              Profil Nasabah Belum Ada
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Akun Anda belum terhubung ke profil nasabah. Silakan hubungi admin
              untuk mendaftarkan profil nasabah Anda terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Form Setor */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Recycle className="text-primary" size={16} />
            </div>
            Ajukan Setoran Baru
          </h2>
          {nasabah ? (
            <FormSetorSampah
              defaultAlamat={nasabah.alamat}
              onSuccess={fetchData}
            />
          ) : (
            <p className="text-zinc-400 text-xs">
              Profil nasabah diperlukan untuk mengajukan setoran.
            </p>
          )}
        </div>

        {/* Cara Setor */}
        <div className="bg-zinc-950 rounded-2xl p-5 text-white shadow-lg">
          <h3 className="text-xs font-bold font-heading mb-4 uppercase tracking-wider text-white/90">
            Alur Proses
          </h3>
          <div className="space-y-3.5">
            {[
              {
                n: "1",
                t: "Isi & Submit",
                d: "Isi form setoran dan klik ajukan",
              },
              {
                n: "2",
                t: "Verifikasi Admin",
                d: "Admin memvalidasi data setoran",
              },
              {
                n: "3",
                t: "Penjemputan",
                d: "Kurir dijadwalkan ke alamat Anda",
              },
              {
                n: "4",
                t: "Serah Terima",
                d: "Konfirmasi setelah menyerahkan ke kurir",
              },
              {
                n: "5",
                t: "Verifikasi & Poin",
                d: "Poin masuk setelah sampah diterima",
              },
            ].map((s) => (
              <div key={s.n} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-white text-xs leading-none">
                    {s.t}
                  </p>
                  <p className="text-zinc-400 text-[10px] mt-1 leading-tight">
                    {s.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
