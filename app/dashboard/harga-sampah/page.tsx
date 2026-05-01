import { prisma } from "@/lib/prisma";
import HargaSampahList, {
  type HargaSampahData,
} from "./components/HargaSampahList";

export default async function HargaSampahPage() {
  const hargaSampah = await prisma.hargaSampah.findMany({
    orderBy: { bulan: "desc" },
  });

  return <HargaSampahList initialData={hargaSampah as HargaSampahData[]} />;
}
