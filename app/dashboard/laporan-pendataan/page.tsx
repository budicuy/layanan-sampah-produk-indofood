import { prisma } from "@/lib/prisma";
import LaporanList, { type LaporanData } from "./components/LaporanList";

export default async function LaporanPage() {
  const laporan = await prisma.laporanPendataan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nasabah: {
        select: {
          id: true,
          nama: true,
          kategori: true,
        },
      },
      produk: {
        select: {
          id: true,
          nama: true,
          brand: true,
        },
      },
    },
  });

  const nasabahs = await prisma.nasabah.findMany({
    select: { id: true, nama: true, kategori: true },
    orderBy: { nama: "asc" },
  });

  const produks = await prisma.produk.findMany({
    select: { id: true, nama: true, brand: true },
    orderBy: { nama: "asc" },
  });

  return (
    <LaporanList
      initialData={laporan as LaporanData[]}
      nasabahs={nasabahs}
      produks={produks}
    />
  );
}
