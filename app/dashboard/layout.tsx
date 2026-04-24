"use client";

import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  Search,
  Settings,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/app/action/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Overview",
      href: "/dashboard",
      active: true,
    },
    {
      icon: <Truck size={20} />,
      label: "Jadwal Jemput",
      href: "/dashboard/pickups",
    },
    {
      icon: <BarChart3 size={20} />,
      label: "Statistik",
      href: "/dashboard/analytics",
    },
    {
      icon: <Recycle size={20} />,
      label: "Poin & Hadiah",
      href: "/dashboard/rewards",
    },
    {
      icon: <Settings size={20} />,
      label: "Pengaturan",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col fixed inset-y-0 z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-16 h-16 relative shrink-0">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            {isSidebarOpen && (
              <span className="font-heading text-xl font-bold tracking-tighter text-white whitespace-nowrap uppercase">
                BANK <span className="text-primary">SAMPAH</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                item.active
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span
                className={
                  item.active
                    ? "text-white"
                    : "group-hover:text-primary transition-colors"
                }
              >
                {item.icon}
              </span>
              {isSidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-4 px-4 py-3 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all group"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="font-medium">Keluar</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}
      >
        {/* Header */}
        <header className="h-20 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center bg-zinc-100 px-4 py-2 rounded-xl w-80">
              <Search size={18} className="text-zinc-400" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-zinc-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-zinc-200" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900">Budicuy</p>
                <p className="text-xs text-zinc-500">Premium Member</p>
              </div>
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <User size={20} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
