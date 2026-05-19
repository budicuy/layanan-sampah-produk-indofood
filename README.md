# 🏦 Bank Sampah (Waste Management Platform)

Platform digital pengelolaan sampah modern berbasis web, dibangun untuk membantu masyarakat mengelola sampah secara efisien dan mendapatkan reward poin yang dapat ditabung.

## ✨ Fitur Utama

1. **Sistem Reward Berbasis Poin (Point-Based Reward)**: Payout nasabah dikonversi dari mata uang rupiah menjadi poin tabungan (`nasabah.poin`) untuk meningkatkan retensi dan gamifikasi.
2. **Dynamic Monthly Pricing**: Perhitungan poin dinamis mengambil data rate reference dari tabel `HargaSampah` berdasarkan jenis sampah (`PLASTIK`, `KARTON`, `PAPER_CUP`) dan bulan pengajuan. Data `Produk` difokuskan sebagai metadata murni (tanpa kolom harga/berat statis).
3. **Dua Alur Pengumpulan Sampah (Dual Workflows)**:
   - **Setor Langsung (`LANGSUNG`)**: Pengguna mengantar sendiri sampah ke pusat pengumpulan. Proses verifikasi langsung menyelesaikan transaksi (Status: `MENUNGGU_VERIFIKASI` $\rightarrow$ `SELESAI`) dan mengkreditkan poin.
   - **Layanan Kurir / Pickup (`EKSPEDISI`)**: Penjemputan terjadwal oleh driver dengan status pelacakan 7 tahap terintegrasi (menunggu verifikasi, terverifikasi, dalam penjemputan, sudah diserahkan, sampah diterima, hingga verifikasi berat aktual & selesai).
4. **Verifikasi Instan ("Data Sudah Benar")**: Admin dapat memverifikasi setoran secara cepat menggunakan satu tombol yang menyamakan berat aktual dengan estimasi nasabah, menghitung perolehan poin otomatis, mencatat log, dan mengkreditkan poin secara real-time.
5. **Dashboard Ganda dengan Proteksi Role (Role-based Dashboards)**:
   - **Dashboard Admin & HRD** (`/dashboard-admin`): Kelola Master Data (Nasabah, Produk, Ekspedisi, Rate Harga), pemrosesan transaksi setoran, tabungan poin, riwayat mutasi, dan laporan analitik pendataan.
   - **Dashboard Konsumen** (`/dashboard-konsumen`): Ringkasan poin aktif, form pengajuan setoran baru (langsung/ekspedisi), timeline status aktif, dan daftar riwayat transaksi.
6. **Autentikasi Aman & Cepat**: Proteksi route menggunakan Custom JWT session di httpOnly cookie yang divalidasi pada tingkat Edge/Middleware (`proxy.ts`).

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
      Charts.tsx         # Grafik rekap sampah bulanan (recharts)
      Clock.tsx          # Widget jam waktu real-time
      NasabahCharts.tsx  # Grafik statistik pendaftaran nasabah
      Sidebar.tsx        # Sidebar panel admin (dashboard, master data, pendataan, tabungan)
    master-data/
      ekspedisi/
        actions.ts       # Server Actions CRUD driver/ekspedisi
        page.tsx         # Halaman CRUD & kelola driver ekspedisi
      harga-sampah/
        actions.ts       # Server Actions CRUD reference points/harga
        page.tsx         # Halaman CRUD kelola rate poin sampah per bulan
      nasabah/
        actions.ts       # Server Actions CRUD nasabah
        page.tsx         # Halaman CRUD kelola akun & status nasabah
      produk/
        actions.ts       # Server Actions CRUD metadata produk
        page.tsx         # Halaman CRUD kelola kode & jenis produk
      users/
        actions.ts       # Server Actions CRUD akun internal (Admin/HRD/Konsumen)
        page.tsx         # Halaman CRUD kelola otentikasi user
    pendataan/
      laporan-pendataan/
        actions.ts       # Server Actions fetch data laporan/rekap
        page.tsx         # Halaman rekap setoran & download laporan cetak
      setor-sampah/
        actions.ts       # Server Actions verifikasi & alur setoran sampah
        page.tsx         # Halaman verifikasi, timbang aktual, & konfirmasi setoran
    tabungan-nasabah/
      tabungan/
        actions.ts       # Server Actions mutasi tabungan poin
        page.tsx         # Halaman ledger tabungan nasabah & detail mutasi poin
    page.tsx             # Halaman Utama Dashboard Admin (Statistik rekap poin & berat)
    layout.tsx           # Layout Panel Admin (navigasi & Sidebar)
  dashboard-konsumen/
    components/
      ConsumerCharts.tsx # Grafik rekap poin pribadi nasabah
      Sidebar.tsx        # Sidebar panel konsumen (dashboard, setor sampah)
    setor-sampah/
      actions.ts         # Server Actions pengajuan setoran baru konsumen
      page.tsx           # Halaman submit setoran sampah baru (langsung/ekspedisi)
    page.tsx             # Halaman Utama Dashboard Konsumen (Rangkuman poin, timeline status)
    layout.tsx           # Layout Panel Konsumen (navigasi & Sidebar)
  login/
    auth/
      index.ts           # JWT signing & verification (HS256 Jose)
      cookies.ts         # Cookie management (httpOnly auth_token)
      session.ts         # Session retrieval (Edge-compatible)
    actions.ts           # Server actions (login, logout)
    page.tsx             # Halaman Login
  api/                   # API routes (kosong)
  layout.tsx             # Root layout (Html, Head, Body, & Providers)
  page.tsx               # Halaman Landing page (Welcome screen & info portal)
  globals.css            # Global CSS (Tailwind CSS 4)
  providers.tsx          # Providers client (Toaster notifications)
lib/
  prisma.ts              # Prisma Client singleton dengan Neon serverless adapter
prisma/
  generated/             # Generated Prisma Client (auto-generated)
  migrations/            # Database migration files
  seeder/
    seed_ekspedisi.ts    # Data dummy driver & kurir
    seed_harga_sampah.ts # Data dummy rate harga & poin bulanan
    seed_nasabah.ts      # Data dummy nasabah (Budi, Warmiendo, Banksampah, Siti)
    seed_produk.ts       # Data dummy metadata produk
  migrate.ts             # Script migrasi schema custom untuk port 5432 yang terblokir
  schema.prisma          # Database schema
  seed.ts                # Main script seeder
public/                  # File statis (favicon, robots.txt, dll)
package.json             # Package dependencies & npm scripts
next.config.ts           # Next.js configuration
tsconfig.json            # TypeScript configuration
proxy.ts                 # Middleware Edge-level routing & session protection
```

## 🔑 Akun Default

Jalankan `bun run db:seed` untuk membuat akun-akun berikut (Konfigurasi lengkap ada di `prisma/seed.ts`):

### 1. Akun Admin / Pengelola
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin` |

### 2. Akun Nasabah / Konsumen (Dummy)
Terdapat beberapa akun nasabah bawaan untuk simulasi:
| Nama | Kategori | Username | Password |
|---|---|---|---|
| Budi Santoso | PERORANGAN | `budi` | `123456` |
| Warmiendo Berkah | WARMIENDO | `warmiendo` | `123456` |
| Bank Sampah Hijau | BANK_SAMPAH | `banksampah` | `123456` |
| Siti Aminah (Status: Nonaktif) | PERORANGAN | `siti` | `123456` |

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
