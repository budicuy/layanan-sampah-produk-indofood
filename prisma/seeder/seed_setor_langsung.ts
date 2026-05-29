export const SetorLangsungSeed: {
  username: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  status: "MENUNGGU_VERIFIKASI" | "SELESAI";
  poinPerKg: number | null;
  totalPoin: number | null;
  selesaiAt: string | null;
  verifikasiAt: string | null;
  verifiedBy: string | null;
}[] = [];

const jenisList = ["PLASTIK", "KARTON", "PAPER_CUP"] as const;
const users = ["budi", "warmiendo"];

// 10 data MENUNGGU_VERIFIKASI
for (let i = 0; i < 50; i++) {
  const jenis = jenisList[i % jenisList.length];
  const berat = Number((2.0 + i * 0.8).toFixed(1));
  SetorLangsungSeed.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: null,
    status: "MENUNGGU_VERIFIKASI",
    poinPerKg: null,
    totalPoin: null,
    selesaiAt: null,
    verifikasiAt: null,
    verifiedBy: null,
  });
}

// 10 data SELESAI
for (let i = 0; i < 10; i++) {
  const jenis = jenisList[i % jenisList.length];
  const berat = Number((3.0 + i * 1.2).toFixed(1));
  const rate = jenis === "PLASTIK" ? 40 : jenis === "KARTON" ? 22 : 21;
  const total = Math.round(berat * rate);
  SetorLangsungSeed.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: berat,
    status: "SELESAI",
    poinPerKg: rate,
    totalPoin: total,
    selesaiAt: `2026-05-${String(5 + i).padStart(2, "0")}`,
    verifikasiAt: `2026-05-${String(5 + i).padStart(2, "0")}`,
    verifiedBy: "Manual oleh Admin",
  });
}
