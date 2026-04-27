import type { Metadata } from "next";
import { Nunito_Sans, Outfit } from "next/font/google";
import "./globals.css";

import Providers from "./providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BANK SAMPAH - Solusi Pengelolaan Sampah Modern",
  description:
    "Layanan pengelolaan sampah terintegrasi untuk masa depan yang lebih bersih.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${nunitoSans.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
