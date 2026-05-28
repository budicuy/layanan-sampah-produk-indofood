const originalSeeds = [
  {
    username: "budi",
    jenisSampah: "PLASTIK",
    beratEstimasi: 3.0,
    beratAktual: 2.8,
    status: "SELESAI" as const,
    poinPerKg: 40,
    totalPoin: 112,
    selesaiAt: "2026-04-05",
    verifikasiAt: "2026-04-03",
    penjemputanAt: "2026-04-04",
    diserahkanAt: "2026-04-04",
  },
  {
    username: "budi",
    jenisSampah: "KARTON",
    beratEstimasi: 5.0,
    beratAktual: 4.5,
    status: "SELESAI" as const,
    poinPerKg: 22,
    totalPoin: 99,
    selesaiAt: "2026-04-15",
    verifikasiAt: "2026-04-13",
    penjemputanAt: "2026-04-14",
    diserahkanAt: "2026-04-14",
  },
  {
    username: "warmiendo",
    jenisSampah: "PLASTIK",
    beratEstimasi: 2.0,
    beratAktual: 1.8,
    status: "SELESAI" as const,
    poinPerKg: 40,
    totalPoin: 72,
    selesaiAt: "2026-04-20",
    verifikasiAt: "2026-04-18",
    penjemputanAt: "2026-04-19",
    diserahkanAt: "2026-04-19",
  },
  {
    username: "budi",
    jenisSampah: "PLASTIK",
    beratEstimasi: 4.0,
    beratAktual: 3.9,
    status: "SELESAI" as const,
    poinPerKg: 40,
    totalPoin: 156,
    selesaiAt: "2026-05-02",
    verifikasiAt: "2026-04-30",
    penjemputanAt: "2026-05-01",
    diserahkanAt: "2026-05-01",
  },
  {
    username: "banksampah",
    jenisSampah: "KARTON",
    beratEstimasi: 8.0,
    beratAktual: 7.5,
    status: "SELESAI" as const,
    poinPerKg: 22,
    totalPoin: 165,
    selesaiAt: "2026-05-03",
    verifikasiAt: "2026-05-01",
    penjemputanAt: "2026-05-02",
    diserahkanAt: "2026-05-02",
  },
];

const jenisSampahList = ["PLASTIK", "KARTON", "PAPER_CUP"];
const users = ["budi", "warmiendo"];

const generatedSeeds: {
  username: string;
  jenisSampah: string;
  beratEstimasi: number;
  beratAktual: number | null;
  status: "MENUNGGU_VERIFIKASI" | "SELESAI";
  poinPerKg: number | null;
  totalPoin: number | null;
  jenisSetor: "LANGSUNG" | "EKSPEDISI";
  selesaiAt: string | null;
  verifikasiAt: string | null;
  penjemputanAt: string | null;
  diserahkanAt: string | null;
}[] = [];

// Generate 10 LANGSUNG, MENUNGGU_VERIFIKASI
for (let i = 0; i < 10; i++) {
  const jenis = jenisSampahList[i % jenisSampahList.length];
  const berat = Number((3.0 + i * 1.2).toFixed(1));
  generatedSeeds.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: null,
    status: "MENUNGGU_VERIFIKASI",
    poinPerKg: null,
    totalPoin: null,
    jenisSetor: "LANGSUNG",
    selesaiAt: null,
    verifikasiAt: null,
    penjemputanAt: null,
    diserahkanAt: null,
  });
}

// Generate 10 LANGSUNG, SELESAI
for (let i = 0; i < 10; i++) {
  const jenis = jenisSampahList[i % jenisSampahList.length];
  const berat = Number((4.0 + i * 1.5).toFixed(1));
  const rate = jenis === "PLASTIK" ? 40 : jenis === "KARTON" ? 22 : 21;
  const total = Math.round(berat * rate);
  generatedSeeds.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: berat,
    status: "SELESAI",
    poinPerKg: rate,
    totalPoin: total,
    jenisSetor: "LANGSUNG",
    selesaiAt: `2026-05-${10 + i}`,
    verifikasiAt: `2026-05-${10 + i}`,
    penjemputanAt: null,
    diserahkanAt: null,
  });
}

// Generate 10 EKSPEDISI, MENUNGGU_VERIFIKASI
for (let i = 0; i < 10; i++) {
  const jenis = jenisSampahList[i % jenisSampahList.length];
  const berat = Number((2.5 + i * 1.1).toFixed(1));
  generatedSeeds.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: null,
    status: "MENUNGGU_VERIFIKASI",
    poinPerKg: null,
    totalPoin: null,
    jenisSetor: "EKSPEDISI",
    selesaiAt: null,
    verifikasiAt: null,
    penjemputanAt: null,
    diserahkanAt: null,
  });
}

// Generate 10 EKSPEDISI, SELESAI
for (let i = 0; i < 10; i++) {
  const jenis = jenisSampahList[i % jenisSampahList.length];
  const berat = Number((3.5 + i * 1.4).toFixed(1));
  const rate = jenis === "PLASTIK" ? 40 : jenis === "KARTON" ? 22 : 21;
  const total = Math.round(berat * rate);
  generatedSeeds.push({
    username: users[i % users.length],
    jenisSampah: jenis,
    beratEstimasi: berat,
    beratAktual: berat,
    status: "SELESAI",
    poinPerKg: rate,
    totalPoin: total,
    jenisSetor: "EKSPEDISI",
    selesaiAt: `2026-05-${12 + i}`,
    verifikasiAt: `2026-05-${10 + i}`,
    penjemputanAt: `2026-05-${11 + i}`,
    diserahkanAt: `2026-05-${11 + i}`,
  });
}

export const SetorSampahSeed = [...originalSeeds, ...generatedSeeds];
