import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SetorSampahAdminList from "./components/SetorSampahAdminList";

export default async function SetorSampahAdminPage() {
  const [setorSampahList, ekpedisiList] = await Promise.all([
    prisma.setorSampah.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nasabah: {
          select: {
            id: true,
            nama: true,
            noTelp: true,
            alamat: true,
            nik: true,
          },
        },
        ekpedisi: {
          select: { noTelp: true, alamat: true },
        },
      },
    }),
    prisma.ekpedisi.findMany({
      select: { id: true, noTelp: true, alamat: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-zinc-900 flex items-center gap-3">
            <PackageSearch className="text-primary" size={32} />
            Setor Sampah
          </h1>
          <p className="text-zinc-500 mt-1">
            Kelola dan verifikasi pengajuan setor sampah dari konsumen.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 text-center">
            <p className="text-2xl font-heading font-bold text-amber-700">
              {
                setorSampahList.filter(
                  (s) => s.status === "MENUNGGU_VERIFIKASI",
                ).length
              }
            </p>
            <p className="text-xs text-amber-600 font-medium">Menunggu</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 text-center">
            <p className="text-2xl font-heading font-bold text-blue-700">
              {
                setorSampahList.filter((s) => s.status === "TERVERIFIKASI")
                  .length
              }
            </p>
            <p className="text-xs text-blue-600 font-medium">Diverifikasi</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 text-center">
            <p className="text-2xl font-heading font-bold text-green-700">
              {setorSampahList.filter((s) => s.status === "SELESAI").length}
            </p>
            <p className="text-xs text-green-600 font-medium">Selesai</p>
          </div>
        </div>
      </div>

      {/* List */}
      <SetorSampahAdminList
        data={
          setorSampahList as Parameters<typeof SetorSampahAdminList>[0]["data"]
        }
        ekpedisiList={ekpedisiList}
      />
    </div>
  );
}
