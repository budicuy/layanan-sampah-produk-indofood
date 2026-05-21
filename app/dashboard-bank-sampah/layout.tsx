import { redirect } from "next/navigation";
import { getSession } from "@/app/login/auth/session";
import BottomNav from "./components/BottomNav";

export default async function BankSampahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  const { user } = session;

  // Protect route - only allow BANK_SAMPAH
  if (user.role !== "BANK_SAMPAH") {
    const target =
      user.role === "KONSUMEN" ? "/dashboard-konsumen" : "/dashboard-admin";
    redirect(target);
  }

  return (
    <div className="min-h-screen bg-zinc-100/50 flex justify-center">
      <div className="max-w-md w-full min-h-screen bg-zinc-50 flex flex-col pb-20 relative border-x border-zinc-100 shadow-2xl">
        <main className="flex-1 p-5 overflow-x-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
