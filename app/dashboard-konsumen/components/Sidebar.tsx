"use client";

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  Ticket,
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
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard-konsumen",
      },
    ],
  },
  {
    group: "Transaksi",
    items: [
      {
        icon: Recycle,
        label: "Setor Sampah",
        href: "/dashboard-konsumen/setor-sampah",
      },
    ],
  },
  {
    group: "Reward",
    items: [
      {
        icon: Ticket,
        label: "Tukar Kupon",
        href: "/dashboard-konsumen/tukar-kupon",
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
              <span className="font-heading text-lg font-black tracking-tight bg-linear-to-r from-red-600 to-amber-500 bg-clip-text text-transparent uppercase">
                SICUAN
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
