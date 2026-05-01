import type { JenisProduk } from "./generated/prisma/enums";

export const ProdukSeed = [
  {
    kode: "PRD-IND-001",
    nama: "Indomie Goreng Original",
    jenis: "PLASTIK" as JenisProduk,
    berat: 0.085, // 85 gram -> 0.085 kg
    brand: "Indofood",
    harga: 3000,
    isi: 40,
  },
  {
    kode: "PRD-IND-002",
    nama: "Karton Indomie Goreng",
    jenis: "KARTON" as JenisProduk,
    berat: 3.5, // 3.5 kg
    brand: "Indofood",
    harga: 110000,
    isi: 1,
  },
  {
    kode: "PRD-CHIT-001",
    nama: "Chitato Sapi Panggang 68g",
    jenis: "PLASTIK" as JenisProduk,
    berat: 0.068,
    brand: "Indofood",
    harga: 9500,
    isi: 30,
  },
  {
    kode: "PRD-CHIT-002",
    nama: "Karton Chitato Sapi Panggang",
    jenis: "KARTON" as JenisProduk,
    berat: 2.2,
    brand: "Indofood",
    harga: 280000,
    isi: 1,
  },
  {
    kode: "PRD-BM-001",
    nama: "Bumbu Racik Nasi Goreng",
    jenis: "PLASTIK" as JenisProduk,
    berat: 0.02,
    brand: "Indofood",
    harga: 1500,
    isi: 100,
  },
];
