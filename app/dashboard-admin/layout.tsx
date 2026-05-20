import { redirect } from "next/navigation";
import Sidebar from "@/app/dashboard-admin/components/Sidebar";
import { getSession } from "@/app/login/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  const { user } = session;

  if (user.role === "KONSUMEN") {
    redirect("/dashboard-konsumen");
  }

  if (user.role === "BANK_SAMPAH") {
    redirect("/dashboard-bank-sampah");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <main className="flex-1 p-4 md:p-6 lg:p-10 w-full max-w-full pt-16 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
