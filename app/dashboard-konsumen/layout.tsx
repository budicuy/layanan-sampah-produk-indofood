import { redirect } from "next/navigation";
import { getSession } from "@/app/login/auth/session";
import Sidebar from "./components/Sidebar";

export default async function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  const { user } = session;

  // Protect route - only allow KONSUMEN
  if (user.role !== "KONSUMEN") {
    redirect("/dashboard-admin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar user={user} />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
