import { LogOut, Recycle, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    username?: string;
    role?: string;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Navbar */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <span className="font-heading text-lg font-bold tracking-tighter text-zinc-900 uppercase">
              BANK <span className="text-primary">SAMPAH</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {(user.name ?? user.username ?? "U")[0].toUpperCase()}
              </div>
              <span className="font-medium">{user.name ?? user.username}</span>
              {user.role && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-secondary text-primary border border-primary/20">
                  {user.role}
                </span>
              )}
            </div>

            <form action={logoutAction}>
              <button
                id="logout-btn"
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-8 mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-primary mb-1">Dashboard</p>
            <h1 className="text-3xl font-heading font-bold text-zinc-900 mb-2">
              Halo, {user.name ?? user.username}! 👋
            </h1>
            <p className="text-zinc-500">
              Selamat datang di panel manajemen Bank Sampah.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Recycle className="w-6 h-6" />,
              label: "Total Sampah",
              value: "0 kg",
              color: "text-green-600 bg-green-50",
            },
            {
              icon: <User className="w-6 h-6" />,
              label: "Poin Reward",
              value: "0 pts",
              color: "text-blue-600 bg-blue-50",
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              label: "Status Akun",
              value: "Aktif",
              color: "text-primary bg-secondary",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-zinc-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-heading font-bold text-zinc-900">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
