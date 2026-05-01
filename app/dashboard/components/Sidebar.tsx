"use client";

import {
  BarChart3,
  Box,
  ClipboardList,
  Coins,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Truck,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/login/actions";

const MENU_GROUPS = [
  {
    group: null,
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    group: "Master data",
    items: [
      { icon: Users, label: "Nasabah Bank", href: "/dashboard/nasabah" },
      { icon: Box, label: "Produk", href: "/dashboard/produk" },
      { icon: Truck, label: "Ekpedisi", href: "/dashboard/ekspedisi" },
      { icon: UserCircle, label: "User", href: "/dashboard/users" },
      { icon: Coins, label: "Harga Sampah", href: "/dashboard/harga-sampah" },
    ],
  },
  {
    group: "Pendataan Bank Sampah",
    items: [
      {
        icon: FileText,
        label: "Laporan",
        href: "/dashboard/laporan-pendataan",
      },
    ],
  },
  {
    group: "Omzet",
    items: [
      {
        icon: BarChart3,
        label: "History Omzet (Coming soon)",
        href: "/dashboard/history-omzet",
      },
      {
        icon: Landmark,
        label: "Mutasi Bank Sampah (Coming soon)",
        href: "/dashboard/mutasi",
      },
    ],
  },
  {
    group: "Buku Tabungan Sampah",
    items: [
      {
        icon: ClipboardList,
        label: "Laporan Vendor (Coming soon)",
        href: "/dashboard/laporan-vendor",
      },
      {
        icon: Wallet,
        label: "Total Tabungan Vendor (Coming soon)",
        href: "/dashboard/total-tabungan",
      },
    ],
  },
];

interface UserProps {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}

export default function Sidebar({ user }: { user: UserProps }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user.name ?? user.username ?? user.email ?? "User";
  const avatar = (displayName[0] ?? "U").toUpperCase();

  return (
    <>
      {/* Mobile Menu Button */}
      <div
        className={`lg:hidden fixed top-4 left-4 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-72" : "translate-x-0"
        }`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-xl shadow-lg border border-zinc-100 text-zinc-600 hover:text-primary transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="lg:hidden fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 w-full h-full border-none cursor-default"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-45 bg-white border-r border-zinc-100 transition-all duration-300 ease-in-out
          ${isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"}
        `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 px-2">
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
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-hide">
            {MENU_GROUPS.map((group) => (
              <div key={group.group ?? "main"} className="space-y-1">
                {group.group && (
                  <h4 className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    {group.group}
                  </h4>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all group
                          ${
                            isActive
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "text-zinc-500 hover:bg-secondary hover:text-primary"
                          }
                        `}>
                        <item.icon
                          size={18}
                          className={
                            isActive
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-primary"
                          }
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Card */}
          <div className="p-6 border-t border-zinc-100">
            <div className="flex items-center gap-3 p-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                {avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-50 text-zinc-600 rounded-xl font-bold text-xs hover:bg-red-50 hover:text-red-600 transition-all border border-zinc-100">
                <LogOut size={14} />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
