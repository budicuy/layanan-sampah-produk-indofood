import { prisma } from "@/lib/prisma";
import ProdukList, { type Produk } from "./components/ProdukList";

export default async function ProdukPage() {
  const produks = await prisma.produk.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <ProdukList initialData={produks as Produk[]} />;
}
