"use client";

import {
  History,
  LayoutDashboard,
  LogOut,
  Recycle,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutAction } from "@/app/login/actions";

export default function BottomNav() {
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard-konsumen",
    },
    {
      icon: Recycle,
      label: "Setor Sampah",
      href: "/dashboard-konsumen/setor-sampah",
    },
    {
      icon: Ticket,
      label: "Tukar Kupon",
      href: "/dashboard-konsumen/tukar-kupon",
    },
    {
      icon: History,
      label: "Riwayat",
      href: "/dashboard-konsumen/riwayat",
    },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-zinc-100/80 shadow-2xl lg:max-w-md lg:mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                  isActive
                    ? "text-primary scale-105 font-semibold"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}>
                <Icon
                  size={20}
                  className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"}
                />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-red-500 transition-colors">
            <LogOut size={20} className="stroke-[2px]" />
            <span className="text-[10px] tracking-wide">Keluar</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl border border-zinc-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <LogOut size={22} className="stroke-[2.5px]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 text-sm">
                Yakin ingin keluar?
              </h3>
              <p className="text-zinc-500 text-[10px] leading-relaxed">
                Anda perlu masuk kembali untuk mengakses dashboard konsumen.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-[10px] hover:bg-zinc-200 transition-colors">
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await logoutAction();
                  });
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-[10px] hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                {isPending ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
