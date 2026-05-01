import { prisma } from "@/lib/prisma";
import EkpedisiList, { type EkpedisiData } from "./components/EkpedisiList";

export default async function EkpedisiPage() {
  const ekpedisi = await prisma.ekpedisi.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <EkpedisiList initialData={ekpedisi as EkpedisiData[]} users={users} />
  );
}
