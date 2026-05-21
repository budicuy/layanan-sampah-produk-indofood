"use client";

import { Download, Info, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PwaGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Detect mobile device
    const userAgent =
      typeof window !== "undefined"
        ? navigator.userAgent || navigator.vendor || (window as any).opera
        : "";
    const mobileRegex =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMob = mobileRegex.test(userAgent.toLowerCase());
    setIsMobile(isMob);

    // Detect standalone mode (already installed & opened from home screen)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(userAgent.toLowerCase());
    setIsIos(ios);

    // Capture beforeinstallprompt for Android/Chrome/Samsung Internet
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log(
            "Service Worker registered successfully with scope:",
            reg.scope,
          );
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
  };

  if (!isMounted) return null;

  // If it's a mobile device and NOT opened as standalone, show the lock screen
  if (isMobile && !isStandalone) {
    return (
      <div className="fixed inset-0 z-[99999] bg-zinc-950 text-white flex flex-col justify-between p-6 overflow-y-auto font-sans">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 py-8">
          {/* App Logo / Brand */}
          <div className="space-y-3">
            <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-orange-500/20 text-white font-black text-2xl font-heading relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full blur-xs" />
              S
            </div>
            <h1 className="text-xl font-heading font-black tracking-tight text-white mt-4">
              INSTAL APLIKASI SICUAN
            </h1>
            <p className="text-zinc-400 text-xs px-4 leading-relaxed">
              Silakan instal aplikasi PWA SICUAN pada perangkat HP Anda terlebih
              dahulu untuk menggunakan layanan ini.
            </p>
          </div>

          {/* Device specific instructions */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 w-full text-left space-y-4 shadow-xl">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-2.5">
              <Info className="w-4 h-4 text-orange-500" />
              Langkah Mudah Instalasi
            </h2>

            {isIos ? (
              <div className="space-y-4 text-xs text-zinc-300">
                <div className="flex gap-3">
                  <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Ketuk Opsi Bagikan</p>
                    <p className="text-[10px] text-zinc-400">
                      Tekan tombol Share/Bagikan{" "}
                      <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />{" "}
                      pada menu Safari di bagian bawah.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">
                      Tambahkan ke Layar Utama
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Gulir ke bawah dan pilih menu{" "}
                      <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home
                      Screen).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                    3
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Buka Aplikasi</p>
                    <p className="text-[10px] text-zinc-400">
                      Kembali ke layar utama HP Anda, lalu ketuk ikon aplikasi{" "}
                      <strong>SICUAN</strong> untuk masuk.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4 text-xs text-zinc-300">
                  <div className="flex gap-3">
                    <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">
                        Ketuk Tombol Instal
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Klik tombol "Instal Aplikasi" di bawah ini.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Konfirmasi Dialog</p>
                      <p className="text-[10px] text-zinc-400">
                        Pilih opsi <strong>"Instal"</strong> pada pop-up
                        konfirmasi yang muncul dari browser.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5.5 h-5.5 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 font-bold text-[11px] text-white">
                      3
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Selesai & Buka</p>
                      <p className="text-[10px] text-zinc-400">
                        Aplikasi akan terpasang di HP Anda. Buka melalui layar
                        utama HP untuk menikmati layanan.
                      </p>
                    </div>
                  </div>
                </div>

                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all mt-4">
                    <Download className="w-3.5 h-3.5" />
                    Instal Aplikasi
                  </button>
                ) : (
                  <div className="pt-3 border-t border-zinc-800/80 text-center">
                    <p className="text-[10px] text-zinc-500 italic">
                      Jika tombol tidak muncul, klik tombol menu (titik tiga) di
                      browser Anda dan pilih opsi "Tambahkan ke Layar Utama" /
                      "Instal Aplikasi".
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="py-4 border-t border-zinc-900/60 text-center">
          <p className="text-[9px] text-zinc-600 tracking-wider">
            &copy; {new Date().getFullYear()} SICUAN. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
