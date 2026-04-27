"use client";

import {
  ArrowRight,
  CalendarCheck,
  Leaf,
  Mail,
  MapPin,
  Menu,
  PhoneCall,
  Plus,
  Recycle,
  Scan,
  ShieldCheck,
  Star,
  Truck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// ---------------------------------------------------------------------------
// DATA CONSTANTS
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { label: "Tentang Kami", href: "#about" },
  { label: "Layanan", href: "#services" },
  { label: "Proses", href: "#process" },
  { label: "FAQ", href: "#faq" },
];

const SERVICES = [
  {
    icon: <Truck className="w-8 h-8" />,
    title: "Penjemputan Otomatis",
    desc: "Layanan jemput sampah otomatis untuk lingkungan PT Indofood Banjarmasin dengan armada modern yang terjadwal.",
  },
  {
    icon: <Recycle className="w-8 h-8" />,
    title: "Pemisahan Sampah",
    desc: "Sistem pemilahan sampah untuk memastikan setiap sampah berakhir di tempat yang tepat.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Layanan Industri",
    desc: "Penanganan limbah komersial dan industri dengan standar keamanan tertinggi.",
  },
];

const PROCESS_STEPS = [
  {
    icon: <CalendarCheck className="w-10 h-10" />,
    step: "01",
    title: "Penjadwalan",
    desc: "Pilih jadwal penjemputan yang sesuai dengan kebutuhan Anda melalui aplikasi kami.",
  },
  {
    icon: <Truck className="w-10 h-10" />,
    step: "02",
    title: "Penjemputan",
    desc: "Tim kami akan datang tepat waktu untuk mengambil sampah yang telah Anda siapkan.",
  },
  {
    icon: <Scan className="w-10 h-10" />,
    step: "03",
    title: "Pemilahan",
    desc: "Sampah dipilah secara teliti oleh tim ahli kami di pusat pengolahan untuk menjamin akurasi pemisahan.",
  },
  {
    icon: <Recycle className="w-10 h-10" />,
    step: "04",
    title: "Daur Ulang",
    desc: "Sampah yang telah dipilah diproses menjadi bahan baku baru yang berguna.",
  },
];

const IMPACT_STATS = [
  { label: "Ton Sampah", value: "50K+" },
  { label: "Kota Terjangkau", value: "120+" },
  { label: "Mitra Aktif", value: "2.5K" },
  { label: "Pohon Terselamatkan", value: "1M+" },
];

const TESTIMONIALS = [
  {
    name: "Budi Santoso",
    role: "Pemilik Restoran",
    text: "Sangat membantu pengelolaan limbah restoran kami. Pelayanannya tepat waktu dan sistem aplikasinya sangat memudahkan.",
    rating: 5,
  },
  {
    name: "Siti Aminah",
    role: "Ibu Rumah Tangga",
    text: "Senang sekali bisa berkontribusi menjaga lingkungan. Sampah dipilah dengan baik dan lingkungan jadi lebih bersih.",
    rating: 5,
  },
  {
    name: "Andi Wijaya",
    role: "Manajer Fasilitas",
    text: "Layanan industri yang sangat profesional. Audit sampah mereka membantu kami mengurangi biaya operasional.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Apa saja jenis sampah yang bisa dijemput?",
    a: "Kami menerima hampir semua jenis sampah domestik, termasuk organik (sisa makanan), anorganik (plastik, kertas, logam), hingga limbah elektronik dalam kategori khusus.",
  },
  {
    q: "Apakah saya harus memilah sampah sendiri?",
    a: "Meskipun kami memiliki tim pemilahan yang sangat teliti, kami tetap menyarankan Anda memisahkan antara sampah basah (organik) dan kering (anorganik) untuk efisiensi maksimal.",
  },
  {
    q: "Bagaimana jika jadwal penjemputan terlewat?",
    a: "Anda dapat menjadwalkan ulang penjemputan melalui fitur 'Reschedule' di aplikasi tanpa dikenakan biaya tambahan maksimal 2 jam sebelum jadwal asli.",
  },
];

const FOOTER_LINKS = {
  quick: [
    { label: "Masuk", href: "/login" },
    { label: "Tentang Kami", href: "#about" },
    { label: "Layanan Kami", href: "#services" },
    { label: "Lokasi", href: "#" },
    { label: "Karir", href: "#" },
  ],
  support: [
    { label: "Pusat Bantuan", href: "#" },
    { label: "Hubungi Kami", href: "#" },
    { label: "Kebijakan Privasi", href: "#" },
    { label: "Syarat & Ketentuan", href: "#" },
  ],
};

const SOCIAL_ICONS = [
  { Icon: PhoneCall, label: "Telepon" },
  { Icon: Mail, label: "Email" },
  { Icon: MapPin, label: "Lokasi" },
];

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tighter text-zinc-900 uppercase">
              BANK <span className="text-primary">SAMPAH</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-zinc-600 hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Desktop Nav Links Section */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold hover:bg-accent transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
              Masuk
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-zinc-100 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-6 gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-zinc-600 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-zinc-100 my-2" />
              <Link
                href="/login"
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-accent transition-all shadow-lg shadow-primary/20 text-center"
                onClick={() => setIsMenuOpen(false)}>
                Masuk
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 pt-20">
        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-sm font-bold mb-6">
                <Leaf className="w-4 h-4" />
                Solusi Sampah Modern
              </div>
              <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-zinc-900 leading-[1.1] mb-6">
                Kelola Sampah <span className="text-primary">Lebih Cerdas</span>{" "}
                Bersama Kami
              </h1>
              <p className="text-lg text-zinc-600 mb-10 max-w-lg leading-relaxed">
                Kami hadir dengan sistem pengelolaan sampah terintegrasi untuk
                menciptakan lingkungan yang bersih, sehat, dan berkelanjutan
                bagi perusahaan PT Indofood cabang Banjarmasin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-accent transition-all shadow-xl shadow-primary/25 group">
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#about"
                  className="px-8 py-4 bg-white border-2 border-zinc-100 text-zinc-900 rounded-2xl font-bold text-lg hover:border-primary hover:text-primary transition-all text-center">
                  Pelajari Layanan
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-3xl" />
              <div className="relative aspect-square rounded-[32px] overflow-hidden shadow-2xl border-8 border-white">
                <Image
                  src="/hero.png"
                  alt="Modern Waste Management"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating Impact Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-zinc-50 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <Recycle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Recycled</div>
                  <div className="text-xl font-bold text-zinc-900">
                    85% Sampah
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── About Section ────────────────────────────────────────────── */}
        <section id="about" className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 relative flex items-center justify-center">
                <div className="absolute -inset-10 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative w-full aspect-square max-w-[480px] group transition-all duration-500">
                  <Image
                    src="/logo.png"
                    alt="Logo Bank Sampah"
                    fill
                    sizes="(max-width: 768px) 80vw, 480px"
                    className="object-contain drop-shadow-[0_20px_50px_rgba(220,38,38,0.2)]"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-sm font-bold">
                  Tentang Kami
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold text-zinc-900 leading-tight">
                  Misi Kami Adalah{" "}
                  <span className="text-primary">Membersihkan</span> Dunia Satu
                  Langkah Sekali.
                </h2>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  <strong>BANK SAMPAH</strong> lahir dari keinginan untuk
                  mengatasi krisis sampah di lingkungan operasional PT Indofood
                  Banjarmasin. Bukan sekadar tempat pembuangan, kami adalah
                  ekosistem yang mengubah limbah menjadi nilai ekonomi sambil
                  menjaga kelestarian alam.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="font-bold text-zinc-900 text-lg font-heading">
                      Visi Kami
                    </div>
                    <p className="text-sm text-zinc-500">
                      Menjadi pionir ekonomi sirkular digital terbesar di Asia
                      Tenggara.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="font-bold text-zinc-900 text-lg font-heading">
                      Nilai Kami
                    </div>
                    <p className="text-sm text-zinc-500">
                      Integritas, Inovasi, dan Kepedulian terhadap Bumi.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:gap-4 transition-all">
                  Kenali Kami Lebih Dalam <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Services Section ─────────────────────────────────────────── */}
        <section id="services" className="py-24 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-heading font-bold text-zinc-900 mb-4">
                Layanan Unggulan Kami
              </h2>
              <p className="text-lg text-zinc-600">
                Kami menyediakan berbagai solusi untuk memenuhi kebutuhan
                pengelolaan sampah perumahan hingga industri.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="bg-white p-10 rounded-[32px] border border-zinc-100 hover:border-primary/20 hover:shadow-2xl transition-all group">
                  <div className="w-16 h-16 bg-secondary text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-4 font-heading">
                    {service.title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process Section ──────────────────────────────────────────── */}
        <section id="process" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-heading font-bold text-zinc-900 mb-4">
                Bagaimana Kami Bekerja
              </h2>
              <p className="text-lg text-zinc-600">
                Proses sederhana namun efektif untuk mengelola sampah Anda
                secara bertanggung jawab.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-12">
              {PROCESS_STEPS.map((item, i) => (
                <div key={item.title} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-zinc-50 text-primary rounded-full flex items-center justify-center mb-6 relative">
                      {item.icon}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-3 font-heading">
                      {item.title}
                    </h3>
                    <p className="text-zinc-500">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-zinc-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Section ────────────────────────────────────────────── */}
        <section
          id="impact"
          className="py-24 bg-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-16">
              Dampak Positif Bersama
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {IMPACT_STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className="text-4xl md:text-6xl font-extrabold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/80 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials Section ─────────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-heading font-bold text-zinc-900 mb-20">
              Kata Mereka
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {TESTIMONIALS.map((testi) => (
                <div key={testi.name} className="flex flex-col items-center">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testi.rating }).map((_, i) => (
                      <Star
                        key={`star-${testi.name}-${i}`}
                        className="w-5 h-5 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-lg text-zinc-600 italic mb-8 leading-relaxed">
                    "{testi.text}"
                  </p>
                  <div className="w-16 h-16 bg-zinc-100 rounded-full mb-4 overflow-hidden">
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <Users className="w-8 h-8 text-zinc-400" />
                    </div>
                  </div>
                  <h4 className="font-bold text-zinc-900 font-heading">
                    {testi.name}
                  </h4>
                  <p className="text-sm text-zinc-500">{testi.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ──────────────────────────────────────────────── */}
        <section id="faq" className="py-24 bg-zinc-50">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-heading font-bold text-zinc-900 text-center mb-16">
              Pertanyaan Umum
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div
                  key={faq.q}
                  className="bg-white rounded-[24px] border border-zinc-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-6 text-left flex justify-between items-center hover:bg-zinc-50 transition-colors">
                    <span className="font-bold text-zinc-900">{faq.q}</span>
                    <Plus
                      className={`w-5 h-5 transition-transform ${activeFaq === i ? "rotate-45" : ""}`}
                    />
                  </button>
                  {activeFaq === i && (
                    <div className="px-6 pb-6 text-zinc-600 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-zinc-900 rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-8 relative z-10">
                Siap Menjaga <span className="text-primary">Bumi Kita?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">
                Bergabunglah dengan ribuan keluarga dan bisnis lainnya yang
                telah beralih ke pengelolaan sampah modern.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <button
                  type="button"
                  className="px-10 py-5 bg-primary text-white rounded-2xl font-bold text-xl hover:bg-accent transition-all">
                  Daftar Sekarang
                </button>
                <button
                  type="button"
                  className="px-10 py-5 bg-white/10 text-white rounded-2xl font-bold text-xl hover:bg-white/20 backdrop-blur-sm transition-all">
                  Pelajari Lebih Lanjut
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-zinc-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            {/* Column 1: Brand & Desc */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 relative">
                  <Image
                    src="/logo.png"
                    alt="Logo Bank Sampah"
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <span className="font-heading text-xl font-bold text-zinc-900 uppercase tracking-tighter">
                  BANK <span className="text-primary">SAMPAH</span>
                </span>
              </div>
              <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
                Membangun masa depan yang lebih bersih melalui teknologi
                pengelolaan sampah yang inovatif dan terjangkau bagi semua
                lapisan masyarakat.
              </p>
              <div className="flex gap-4">
                {SOCIAL_ICONS.map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 font-heading">
                Tautan Cepat
              </h4>
              <ul className="space-y-4 text-zinc-600">
                {FOOTER_LINKS.quick.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="font-bold text-zinc-900 mb-6 font-heading">
                Bantuan
              </h4>
              <ul className="space-y-4 text-zinc-600">
                {FOOTER_LINKS.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-10 text-center text-zinc-400 text-sm">
            © {new Date().getFullYear()} BANK SAMPAH. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
