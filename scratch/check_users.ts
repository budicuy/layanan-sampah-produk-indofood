import { prisma } from "../lib/prisma";

async function check() {
  const allConsumers = await prisma.user.count({ where: { role: "KONSUMEN" } });
  const consumersWithNasabah = await prisma.nasabah.count();
  const available = await prisma.user.count({
    where: {
      role: "KONSUMEN",
      nasabah: null,
    },
  });

  console.log(`Total Consumers: ${allConsumers}`);
  console.log(`Consumers with Nasabah: ${consumersWithNasabah}`);
  console.log(`Available for linking: ${available}`);
}

check();
