import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "./components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const { user } = session;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar user={user} />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
