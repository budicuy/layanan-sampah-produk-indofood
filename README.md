# 🏦 SICUAN (Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai)

Platform digital pengelolaan sampah modern berbasis web, dibangun untuk membantu masyarakat mengelola sampah secara efisien dan mendapatkan reward poin yang dapat ditabung.

## ✨ Fitur Utama

1. **Sistem Reward Berbasis Poin (Point-Based Reward)**: Payout nasabah dikonversi dari mata uang rupiah menjadi poin tabungan (`nasabah.poin`) untuk meningkatkan retensi dan gamifikasi.
2. **Dynamic Monthly Pricing**: Perhitungan poin dinamis mengambil data rate reference dari tabel `HargaSampah` berdasarkan jenis sampah (`PLASTIK`, `KARTON`, `PAPER_CUP`) dan bulan pengajuan. Data `Produk` difokuskan sebagai metadata murni (tanpa kolom harga/berat statis).
3. **Dua Alur Pengumpulan Sampah (Dual Workflows)**:
   - **Setor Langsung (`LANGSUNG`)**: Pengguna mengantar sendiri sampah ke pusat pengumpulan. Proses verifikasi langsung menyelesaikan transaksi (Status: `MENUNGGU_VERIFIKASI` $\rightarrow$ `SELESAI`) dan mengkreditkan poin.
   - **Layanan Kurir / Pickup (`EKSPEDISI`)**: Penjemputan terjadwal oleh driver dengan status pelacakan 7 tahap terintegrasi (menunggu verifikasi, terverifikasi, dalam penjemputan, sudah diserahkan, sampah diterima, hingga verifikasi berat aktual & selesai).
4. **Verifikasi Instan (\"Data Sudah Benar\")**: Admin dapat memverifikasi setoran secara cepat menggunakan satu tombol yang menyamakan berat aktual dengan estimasi nasabah, menghitung perolehan poin otomatis, mencatat log, dan mengkreditkan poin secara real-time.
5. **Pencairan Dana Bank Sampah**: Alur pencairan saldo uang khusus nasabah kategori Bank Sampah:
   - **Dashboard Bank Sampah**: Ajukan pencairan (kelipatan Rp 50.000, min Rp 50.000) dengan catatan opsional; lihat riwayat pengajuan & bukti foto pencairan.
   - **Dashboard Admin**: Verifikasi → Cairkan (dengan upload foto bukti transfer ke Cloudflare R2, dikompres otomatis ≤ 50KB) → Tolak. Saldo nasabah dipotong otomatis & mutasi dibuat saat pencairan dikonfirmasi.
6. **Dashboard Multi-Role dengan Proteksi (Role-based Dashboards)**:
   - **Dashboard Admin & HRD** (`/dashboard-admin`): Kelola Master Data (Nasabah, Produk, Ekspedisi, Rate Harga), pemrosesan transaksi setoran, tabungan poin, riwayat mutasi, dan laporan analitik pendataan.
   - **Dashboard Konsumen & Bank Sampah** (`/dashboard-konsumen` & `/dashboard-bank-sampah`): Mengusung desain **Pure Mobile-first** dengan navigasi bilah bawah (bottom navigation bar) yang dioptimalkan untuk perangkat seluler/smartphone, susunan kartu statistik (stats grid) yang presisi tanpa ada slot kosong, layout compact yang rapi tanpa scroll horizontal, form input minimalis, tracker alur setoran yang responsif, serta dialog konfirmasi interaktif untuk keluar (logout).
7. **Autentikasi Aman & Cepat**: Proteksi route menggunakan Custom JWT session di httpOnly cookie yang divalidasi pada tingkat Edge/Middleware (`proxy.ts`).
8. **Dukungan Progressive Web App (PWA) & Mobile Installation Gate**:
   - Mendukung instalasi aplikasi secara native di ponsel Android/iOS melalui file `manifest.ts` dan caching Service Worker (`sw.js`).
   - Dilengkapi dengan fitur **PwaGate**: Ketika pengguna mengakses platform dari browser perangkat mobile, antarmuka akan terkunci oleh layar instruksi premium yang meminta mereka menginstal PWA terlebih dahulu sebelum dapat mengakses dashboard.

## Requirements

- Bun >= 1.3 | https://bun.com/
- Neon PostgreSQL | https://neon.tech/

## VScode Extensions

| Extension | Link | 
| --- | --- |
| Biome | https://marketplace.visualstudio.com/items?itemName=biomejs.biome |
| Prisma | https://marketplace.visualstudio.com/items?itemName=Prisma.prisma |
| Tailwind CSS IntelliSense | https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss |
| PostCSS Language Support | https://marketplace.visualstudio.com/items?itemName=csstools.postcss |

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Autentikasi | JWT (Custom) |
| Linting | Biome |

## 🚀 Memulai

```bash
# Clone repository
git clone https://github.com/budicuy/layanan-sampah-produk-indofood.git
cd layanan-sampah-produk-indofood

# Install dependencies
bun install
```

## 🗄️ Setup Env

```bash
# Buat file .env.local di root direktory dan copas konfigurasi berikut:
DATABASE_URL="" # database neon bisa cek di https://neon.tech/ | Contoh: postgresql://neondb_owner:[PASSWORD]/neondb?sslmode=require&channel_binding=require
JWT_SECRET="" # secret jwt teks random 32 karakter (gunakan openssl rand -base64 32)
NODE_ENV="development"
```

## 📁 Struktur Proyek

```text
app/
  dashboard-admin/
    components/
      Charts.tsx         # Visualisasi chart recharts untuk grafik bulanan total poin & berat setoran.
      Clock.tsx          # Widget digital penampil jam/waktu real-time untuk efisiensi admin.
      NasabahCharts.tsx  # Grafik statistik pendaftaran nasabah berdasarkan kategori.
      Sidebar.tsx        # Navigasi dashboard panel admin (Master Data, Pendataan, & Tabungan).
    master-data/         # Modul manajemen CRUD data primer (halaman mandiri terpadu).
      ekspedisi/
        actions.ts       # Server Actions untuk CRUD kurir & driver penjemputan sampah.
        page.tsx         # Tampilan tabel & form input data kurir ekspedisi.
      harga-sampah/
        actions.ts       # Server Actions CRUD acuan harga/poin bulanan per jenis sampah.
        page.tsx         # Kelola harga referensi bulanan per kilogram sampah.
      nasabah/
        actions.ts       # Server Actions kelola nasabah & penambahan saldo poin awal.
        page.tsx         # Kelola status keanggotaan nasabah (aktif/nonaktif) & verifikasi data.
      users/
        actions.ts       # Server Actions CRUD user login sistem (Admin, HRD, Konsumen).
        page.tsx         # Kelola otentikasi login pengguna sistem.
      raw-material/
        actions.ts       # Server Actions CRUD master data raw material (Bahan Baku).
        page.tsx         # Kelola standar berat kemasan produk (Etiket, Karton, Cup).
    pendataan/           # Modul administrasi timbangan masuk dan pelaporan.
      laporan-pendataan/
        actions.ts       # Aksi server penarikan data rekap setoran, pencairan dana, & penukaran kupon.
        page.tsx         # Halaman laporan komprehensif (Setoran, Pencairan Dana, Kupon) lengkap dengan stats & chart.
      setor-sampah/
        actions.ts       # Aksi verifikasi alur setoran (timbang aktual & kredit poin).
        page.tsx         # Panel validasi setoran, tombol "Data Sudah Benar", & input berat aktual.
    tabungan-nasabah/    # Pengelolaan point ledger & history point.
      tabungan/
        actions.ts       # Aksi server pengambilan detail mutasi tabungan poin nasabah.
        page.tsx         # Buku tabungan nasabah beserta riwayat kredit/debit mutasi poin/uang nasabah.
    reward-poin/         # Pengelolaan reward poin & kupon klaim
      tier/
        actions.ts       # Server Actions untuk mengelola minimum poin & deskripsi tier kupon.
        page.tsx         # Kelola konfigurasi tier kupon (Diamond, Gold, Platinum).
      kupon/
        actions.ts       # Server Actions untuk mengambil kupon terklaim & tandai digunakan.
        page.tsx         # Daftar riwayat penukaran kupon oleh konsumen nasabah.
    page.tsx             # Halaman utama Admin (rekap ringkasan total setoran & nasabah aktif).
    layout.tsx           # Layout Panel Admin (navigasi & Sidebar).
  dashboard-konsumen/
    components/
      ConsumerCharts.tsx # Visualisasi grafik poin pribadi yang didapatkan nasabah bulanan.
      Sidebar.tsx        # Navigasi dashboard panel konsumen (Dashboard, Setor Sampah).
    setor-sampah/
      actions.ts         # Server Actions pengajuan setoran baru konsumen.
      page.tsx           # Form pendaftaran setoran baru (Langsung / Ekspedisi) & input estimasi.
    tukar-kupon/
      actions.ts         # Server Actions untuk alur penukaran kupon reward nasabah.
      page.tsx           # Tampilan penukaran poin ke kupon, tiket kupon aktif & QR Code.
    page.tsx             # Halaman utama Konsumen (ringkasan poin aktif, timeline status aktif).
    layout.tsx           # Layout Panel Konsumen (navigasi & Sidebar).
  dashboard-bank-sampah/
    components/
      BottomNav.tsx      # Navigasi menu bawah mobile-first (Dashboard, Setor Sampah, Pencairan, Keluar).
    setor-sampah/
      actions.ts         # Server Actions pengajuan setoran langsung & data nasabah Bank Sampah.
      page.tsx           # Form pendaftaran setoran langsung, riwayat transaksi, & info saldo Rupiah.
    page.tsx             # Halaman utama Bank Sampah (rekap saldo rupiah, setoran selesai & ringkasan).
    layout.tsx           # Layout Panel Bank Sampah (mobile-first container & BottomNav).
  kupon-validasi/[kode]/
    actions.ts           # Server Actions validasi kupon & tandai kupon telah digunakan.
    page.tsx             # Halaman publik validasi keaslian kupon & detail kupon.
  login/
    auth/
      index.ts           # Token utility JWT (signing & verify) menggunakan HS256 Jose.
      cookies.ts         # Konfigurasi manajemen cookie httpOnly aman (auth_token).
      session.ts         # Helper edge-compatible untuk parsing session JWT.
    actions.ts           # Server actions untuk autentikasi kredensial login & logout.
    page.tsx             # Halaman form Login admin, HRD, dan konsumen.
  layout.tsx             # Root layout (Html, Head, Body, & global Providers).
  page.tsx               # Halaman depan / Landing Page sistem Bank Sampah.
  globals.css            # Global styling framework Tailwind CSS v4.
  providers.tsx          # Client notification provider (Toaster).
lib/
  prisma.ts              # Prisma Client singleton dengan Neon serverless adapter.
prisma/
  generated/             # Generated Prisma Client (auto-generated).
  migrations/            # Kumpulan berkas database migration.
  seeder/                # Sub-seeder modular pemisah data dummy awal:
    seed_admin.ts        # Data kredensial admin awal.
    seed_ekspedisi.ts    # Data dummy driver & kurir ekspedisi.
    seed_harga_sampah.ts # Data dummy rate harga/poin bulanan.
    seed_nasabah.ts      # Data dummy profil nasabah awal & username.
    seed_setor_sampah.ts # Data dummy transaksi setoran sampah awal.
  migrate.ts             # Script migrasi custom via HTTP adapter (bypass port 5432 terblokir).
  schema.prisma          # Skema pemodelan database relational Prisma.
  seed.ts                # Main seeder untuk inisialisasi awal database.
public/                  # Aset statis favicon, robots, gambar, dll.
package.json             # Konfigurasi scripts run & dependencies project.
next.config.ts           # Konfigurasi Next.js app compiler & proxy middleware.
tsconfig.json            # Konfigurasi compiler TypeScript.
proxy.ts                 # Middleware Edge-level routing & session protection
```

## 🔑 Akun Default

Jalankan `bun run db:seed` untuk membuat akun-akun berikut (Konfigurasi lengkap ada di `prisma/seed.ts`):

### 1. Akun Admin / Pengelola
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin` |

### 2. Akun Nasabah / Konsumen & Bank Sampah (Dummy)
Terdapat beberapa akun bawaan untuk simulasi:
| Nama | Kategori | Role | Username | Password |
|---|---|---|---|---|
| Budi Santoso | PERORANGAN | `KONSUMEN` | `budi` | `123456` |
| Warmiendo Berkah | WARMIENDO | `KONSUMEN` | `warmiendo` | `123456` |
| Bank Sampah Hijau | BANK_SAMPAH | `BANK_SAMPAH` | `banksampah` | `123456` |
| Siti Aminah (Status: Nonaktif) | PERORANGAN | `KONSUMEN` | `siti` | `123456` |

## 🛠️ Perintah Pengembangan

```bash
# Jalankan development server
bun dev

# Sinkronisasi database (Menggunakan direct TCP port 5432 - dapat gagal jika diblokir provider internet)
bun prisma db push

# Sinkronisasi database alternatif (Direkomendasikan jika port 5432 diblokir, menggunakan Neon HTTP adapter)
bun run prisma/migrate.ts

# Generate Prisma client
bun run db:generate

# Seed data awal & reset transaksi (Mempopulasi data poin default)
bun run db:seed

# Linting & Formatting
bun run lint
bun run format
```
