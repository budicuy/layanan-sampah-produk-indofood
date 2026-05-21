"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const userAgent = navigator.userAgent || navigator.vendor || "";
    const mobileRegex =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    setIsMobile(mobileRegex.test(userAgent.toLowerCase()));

    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    setIsIos(/iphone|ipad|ipod/.test(userAgent.toLowerCase()));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err);
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // During SSR / before hydration, always render children to prevent blank white screen
  if (!isMounted) return <>{children}</>;

  // Allow only if opened as standalone PWA (installed & launched from home screen)
  if (isMobile && !isStandalone) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white text-zinc-900 flex flex-col justify-between overflow-y-auto font-sans">
        {/* Red top accent bar */}
        <div className="h-1.5 w-full bg-red-600 shrink-0" />

        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6 px-6 py-8">
          {/* App Logo */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-100 border border-zinc-100 overflow-hidden">
              {/* biome-ignore lint/performance/noImgElement: local public asset, next/image not required */}
              <img
                src="/logo.png"
                alt="Logo SICUAN"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-heading font-black tracking-tight text-zinc-900">
                INSTAL APLIKASI SICUAN
              </h1>
              <p className="text-zinc-500 text-xs px-2 leading-relaxed">
                Untuk menggunakan layanan ini, instal aplikasi SICUAN di HP Anda
                terlebih dahulu.
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 w-full text-left space-y-4 shadow-xs">
            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-200 pb-2.5">
              <Info className="w-3.5 h-3.5" />
              Langkah Mudah Instalasi
            </h2>

            {/* Installed success state */}
            {isInstalled ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-green-800">
                      Aplikasi Berhasil Diinstal!
                    </p>
                    <p className="text-[10px] text-green-700 mt-0.5 leading-relaxed">
                      Tutup browser ini, lalu buka aplikasi{" "}
                      <strong>SICUAN</strong> dari layar utama HP Anda.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 font-black text-[10px] text-red-700">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-800">
                      Tutup Browser
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Keluar dari browser yang Anda gunakan sekarang.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 font-black text-[10px] text-red-700">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-800">
                      Buka dari Layar Utama
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Cari dan ketuk ikon <strong>SICUAN</strong> di layar utama
                      HP Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Sudah dibuka dari icon? Muat Ulang
                </button>
              </div>
            ) : isIos ? (
              /* iOS instructions */
              <div className="space-y-4 text-xs text-zinc-600">
                {[
                  {
                    label: "Ketuk Opsi Bagikan",
                    desc: (
                      <>
                        Tekan tombol Share/Bagikan{" "}
                        <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" />{" "}
                        pada menu Safari di bagian bawah.
                      </>
                    ),
                  },
                  {
                    label: "Tambahkan ke Layar Utama",
                    desc: (
                      <>
                        Gulir ke bawah dan pilih menu{" "}
                        <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home
                        Screen).
                      </>
                    ),
                  },
                  {
                    label: "Buka Aplikasi",
                    desc: (
                      <>
                        Kembali ke layar utama HP Anda, lalu ketuk ikon{" "}
                        <strong>SICUAN</strong> untuk masuk.
                      </>
                    ),
                  },
                ].map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <span className="w-6 h-6 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 font-black text-[10px] text-red-700">
                      {i + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-zinc-800">{step.label}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Android / Chrome instructions */
              <div className="space-y-4">
                <div className="space-y-4 text-xs text-zinc-600">
                  {[
                    {
                      label: "Ketuk Tombol Instal",
                      desc: 'Klik tombol "Instal Aplikasi" di bawah ini.',
                    },
                    {
                      label: "Konfirmasi Dialog",
                      desc: 'Pilih opsi "Instal" pada pop-up konfirmasi yang muncul dari browser.',
                    },
                    {
                      label: "Buka dari Layar Utama",
                      desc: "Aplikasi akan terpasang di HP Anda. Buka melalui ikon SICUAN di layar utama.",
                    },
                  ].map((step, i) => (
                    <div key={step.label} className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 font-black text-[10px] text-red-700">
                        {i + 1}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-800">{step.label}</p>
                        <p className="text-[10px] text-zinc-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-200 transition-all mt-2">
                    <Download className="w-3.5 h-3.5" />
                    Instal Aplikasi
                  </button>
                ) : (
                  <div className="pt-3 border-t border-zinc-200 text-center">
                    <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                      Jika tombol tidak muncul, ketuk menu (titik tiga) di
                      browser Anda lalu pilih{" "}
                      <strong>"Tambahkan ke Layar Utama"</strong> atau{" "}
                      <strong>"Instal Aplikasi"</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 text-center shrink-0">
          <p className="text-[9px] text-zinc-400 tracking-wider">
            &copy; {new Date().getFullYear()} SICUAN. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
