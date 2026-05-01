import { prisma } from "@/lib/prisma";
import NasabahList, { type Nasabah } from "./components/NasabahList";

export default async function NasabahPage() {
  const nasabahs = await prisma.nasabah.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return <NasabahList initialData={nasabahs as Nasabah[]} />;
}
