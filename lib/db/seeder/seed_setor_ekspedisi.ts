export const SetorEkspedisiSeed: {
  username: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  status:
    | "MENUNGGU_VERIFIKASI"
    | "TERVERIFIKASI"
    | "DITOLAK"
    | "DALAM_PENJEMPUTAN"
    | "SUDAH_DISERAHKAN"
    | "SAMPAH_DITERIMA"
    | "SELESAI";
  poinPerKg: number | null;
  totalPoin: number | null;
  selesaiAt: string | null;
  verifikasiAt: string | null;
  penjemputanAt: string | null;
  diserahkanAt: string | null;
  sampahDiterimaAt: string | null;
  verifiedBy: string | null;
}[] = [];

const jenisList = ["PLASTIK", "KARTON", "PAPER_CUP"] as const;
const users = ["budi", "warmiendo"];

for (let i = 0; i < 10; i++) {
  const jenis = jenisList[i % jenisList.length];
  const berat = Number((2.5 + i * 1.1).toFixed(1));
  const rate = jenis === "PLASTIK" ? 40 : jenis === "KARTON" ? 22 : 21;
  const total = Math.round(berat * rate);
  const baseDay = 5 + i;

  SetorEkspedisiSeed.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: berat,
    status: "SELESAI",
    poinPerKg: rate,
    totalPoin: total,
    verifikasiAt: `2026-05-${String(baseDay).padStart(2, "0")}`,
    penjemputanAt: `2026-05-${String(baseDay + 1).padStart(2, "0")}`,
    diserahkanAt: `2026-05-${String(baseDay + 1).padStart(2, "0")}`,
    sampahDiterimaAt: `2026-05-${String(baseDay + 2).padStart(2, "0")}`,
    selesaiAt: `2026-05-${String(baseDay + 2).padStart(2, "0")}`,
    verifiedBy: "Manual oleh Admin",
  });
}

// 10 data SELESAI (full workflow)
for (let i = 0; i < 10; i++) {
  const jenis = jenisList[i % jenisList.length];
  const berat = Number((3.5 + i * 1.4).toFixed(1));
  const rate = jenis === "PLASTIK" ? 40 : jenis === "KARTON" ? 22 : 21;
  const total = Math.round(berat * rate);
  const baseDay = 5 + i;
  SetorEkspedisiSeed.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: berat,
    status: "SELESAI",
    poinPerKg: rate,
    totalPoin: total,
    verifikasiAt: `2026-05-${String(baseDay).padStart(2, "0")}`,
    penjemputanAt: `2026-05-${String(baseDay + 1).padStart(2, "0")}`,
    diserahkanAt: `2026-05-${String(baseDay + 1).padStart(2, "0")}`,
    sampahDiterimaAt: `2026-05-${String(baseDay + 2).padStart(2, "0")}`,
    selesaiAt: `2026-05-${String(baseDay + 2).padStart(2, "0")}`,
    verifiedBy: "Manual oleh Admin",
  });
}
