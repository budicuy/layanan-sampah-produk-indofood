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
8. **Verifikasi Timbangan Cerdas dengan AI (Gemini)**:
   - Konsumen mengunggah foto display timbangan yang dianalisis secara otomatis oleh AI Gemini (mendukung sistem fallback berantai Model 1 $\rightarrow$ Model 2 $\rightarrow$ Model 3 jika terjadi error API).
   - Melakukan parsing otomatis angka timbangan & konversi satuan (gram ke kg), membandingkannya dengan estimasi berat user. Jika selisih $\le$ 0.5 kg, status validasi otomatis `"VALID"`, jika tidak status menjadi `"PERLU_REVIEW"`.
   - Admin dapat meninjau detail foto timbangan utama dan foto-foto bukti tambahan (1-4 foto wajib pendukung) melalui modal galeri interaktif.

## Requirements

- Bun >= 1.3 | https://bun.com/
- Neon PostgreSQL | https://neon.tech/

## VScode Extensions

| Extension | Link | 
| --- | --- |
| Biome | https://marketplace.visualstudio.com/items?itemName=biomejs.biome |
| Drizzle | https://marketplace.visualstudio.com/items?itemName=drizzle-team.drizzle-vscode |
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
| ORM | Drizzle |
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
  db.ts                  # Client singleton Drizzle ORM dengan deteksi N+1 query.
  db/
    schema.ts            # Skema pemodelan database relational Drizzle.
prisma/
  seeder/                # Sub-seeder modular pemisah data dummy awal:
    seed_admin.ts        # Data kredensial admin awal.
    seed_ekspedisi.ts    # Data dummy driver & kurir ekspedisi.
    seed_harga_sampah.ts # Data dummy rate harga/poin bulanan.
    seed_nasabah.ts      # Data dummy profil nasabah awal & username.
    seed_setor_sampah.ts # Data dummy transaksi setoran sampah awal.
  seed.ts                # Main seeder untuk inisialisasi awal database menggunakan Drizzle.
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

# Sinkronisasi database Drizzle (membuat file migrasi)
bunx drizzle-kit generate

# Seed data awal & reset transaksi (Mempopulasi data poin default)
bun run db:seed

# Linting & Formatting
bun run lint
bun run format
```

## 🛠️ Riwayat Perubahan Terbaru

- **Perbaikan Batch Verifikasi (Setor Sampah)**: Memperbaiki masalah tombol konfirmasi verifikasi ter-disable saat memilih/menandai beberapa item sekaligus. Masalah ini diselesaikan dengan mengganti hook `useEffect` pengontrol modal dengan handler fungsi eksplisit `openBatchModal` dan `closeBatchModal` untuk inisialisasi state, menghindari efek samping re-render yang mereset status penandaan item.

- **Field `verifiedBy` pada SetorSampah**: Menambahkan kolom `verifiedBy` (TEXT) ke tabel `setor_sampah` di database. Nama admin yang memverifikasi kini disimpan terpisah dari catatan opsional (`catatanAdmin`). Dashboard konsumen (halaman Riwayat dan Setor Sampah) menampilkan info "Diverifikasi oleh: [nama admin]" secara eksplisit. Field `catatanAdmin` kini murni untuk catatan opsional admin saja.

- **Perbaikan Parsing JSON Gemini (lib/gemini.ts)**: Model-model Gemma (gemma-4-31b-it, gemma-4-26b-a4b-it) mengabaikan `responseMimeType: "application/json"` dan mengembalikan teks reasoning sebelum JSON. Ditambahkan fungsi `extractJson()` yang mencari JSON object pertama secara robust di dalam teks response menggunakan dua strategi: (1) ekstrak dari markdown code fence, (2) parsing karakter per karakter untuk menemukan `{...}` yang seimbang. Model 1 & 2 sekarang berhasil di-parse meskipun ada teks reasoning.

- **Optimasi Kueri Database (Server Actions)**: 
  - Menyelesaikan masalah kueri N+1 pada `batchVerifikasiSetorLangsung` dengan melakukan pra-fetch referensi harga terbaru di luar loop/transaksi dan melakukan pencarian langsung di memori.
  - Mempercepat kueri nasabah pada fitur pencairan Bank Sampah dengan mengganti relasi JOIN `findFirst` yang lambat menjadi lookup langsung menggunakan kunci unik/primer `findUnique` berdasarkan `userId` dari session.
  - Menyelesaikan tipe data tidak cocok pada admin tabungan dengan merelasikan serta menggabungkan alur `setorLangsung` dan `setorEkspedisi` menjadi list `setorSampah` yang terurut di server sebelum dikirimkan ke frontend, guna menghindari potensi crash akibat properti `.setorSampah` bernilai `undefined`.

- **Penanganan Error Server Actions (Produksi)**:
  - Mengubah aksi server `submitSetorLangsung`, `submitSetorSampah`, dan `konfirmasiSerahTerima` di dashboard konsumen agar menangkap error menggunakan `try/catch` dan mengembalikan objek status `{ success, error }` alih-alih melempar error langsung.
  - Hal ini mencegah Next.js menyamarkan pesan error asli di lingkungan produksi dengan pesan generic *"An error occurred in the Server Components render"*, sehingga memudahkan diagnosis kendala konfigurasi R2, Neon DB, atau API Key Gemini secara langsung di antarmuka konsumen.

- **Penyederhanaan & Proteksi Pengajuan Setoran Konsumen**:
  - Menghapus daftar *Riwayat Setoran* dari halaman `/dashboard-konsumen/setor-sampah` agar antarmuka fokus pada proses pengajuan.
  - Memperbaiki alur proteksi transaksi: Halaman Setor Langsung tetap dapat diakses kapan saja oleh konsumen tanpa terpengaruh oleh adanya ekspedisi aktif.
  - Panel pelacak progres ekspedisi aktif kini hanya akan ditampilkan secara khusus ketika konsumen memilih opsi metode "Setor Via Ekspedisi" saat masih memiliki penjemputan aktif yang sedang berlangsung (belum berstatus `SELESAI` atau `DITOLAK`), lengkap dengan tombol kembali ke menu pilihan metode agar konsumen tetap dapat beralih ke Setor Langsung jika diinginkan.
  - Pembersihan duplikasi kode rendering di halaman `page.tsx` konsumen agar berjalan dengan optimal dan bebas dari redundansi.
  - Perbaikan warna border: Mengganti utility class warna border tidak valid `border-zinc-150` dan `border-zinc-150/70` menjadi standard `border-zinc-200` pada seluruh halaman pengusulan setoran & riwayat konsumen untuk menghilangkan tampilan border hitam default bawaan browser yang merusak estetika antarmuka.
  - Pembaruan Data Seeder (`SetorEkspedisi`): Mengubah seeder data agar tidak ada lagi data ekspedisi dengan status `MENUNGGU_VERIFIKASI`. Seluruh seed transaksi kurir yang sebelumnya menunggu kini didefinisikan dalam berbagai tahapan status terverifikasi (`TERVERIFIKASI`, `DALAM_PENJEMPUTAN`, `SUDAH_DISERAHKAN`, dan `SAMPAH_DITERIMA`) dengan informasi verifikator dan penugasan kurir ekspedisi yang lengkap.
  - Pembatasan Riwayat Setor Langsung: Membatasi tampilan daftar Riwayat Setor Langsung pada halaman konsumen maksimal sebanyak 3 entri saja (`riwayat.slice(0, 3)`) agar tata letak halaman tetap ringkas, bersih, dan nyaman dibaca tanpa scroll yang terlalu panjang.
  - Implementasi Pagination Riwayat Konsumen: Menambahkan fitur pagination dinamis pada halaman `/dashboard-konsumen/riwayat` dengan batasan maksimal 20 data per halaman. Data riwayat setoran diambil langsung dari database secara real-time berdasarkan halaman aktif dan tab metode setoran yang dipilih. Menghapus loading screen full-page dan menggantinya dengan efek opacity transisi halus (`opacity-60`) dan *spinner inline* agar navigasi halaman terasa lebih instan, premium, dan dinamis tanpa ada kedipan tata letak (*layout shift*).

- **Optimasi Query: Eliminasi N+1 pada Halaman Admin Setor Sampah**:
  - Mengidentifikasi dan memperbaiki masalah N+1 query pada halaman `/dashboard-admin/pendataan/setor-sampah` di mana fungsi `getHargaTerbaru()` dipanggil secara terpisah untuk setiap item setoran yang tampil di layar (satu request per jenis sampah per panel).
  - Menambahkan fungsi baru `getAllHargaTerbaru()` di `actions.ts` yang mengambil seluruh data harga referensi terbaru per jenis sampah dalam **satu query tunggal** (`SELECT ... FROM harga_sampah ORDER BY bulan DESC`), lalu mem-build `Record<jenisSampah, harga>` secara in-memory.
  - Mengintegrasikan `getAllHargaTerbaru()` ke dalam fungsi `fetchData` halaman utama admin sehingga data harga di-load paralel bersama data setor dan kurir (`Promise.all`), bukan diambil on-demand per komponen.
  - Meneruskan data harga sebagai prop `hargaMap` ke komponen `SetorCard`, lalu ke `PanelVerifikasiLangsung` dan `PanelVerifikasiAkhir`. Kedua panel kini tidak lagi memanggil `getHargaTerbaru` secara individual maupun menyimpan state `loadingHarga` terpisah.
  - Hasil: jumlah query database pada batch verifikasi turun drastis dari **N query per item** menjadi **1 query total** untuk seluruh tabel `harga_sampah`, sehingga response time panel verifikasi jauh lebih cepat.

- **Perbaikan Transaction Timeout P2028 pada Batch Verifikasi Setor Langsung**:
  - Mengidentifikasi error `PrismaClientKnownRequestError P2028` (transaction expired) pada fungsi `batchVerifikasiSetorLangsung` ketika memproses batch besar (≥30 item). Penyebab: *interactive transaction* (`$transaction(async tx => {...})`) menjalankan `await` secara sequential per item di dalam loop, totalnya melebihi timeout default 5000ms.
  - Refaktor ke **non-interactive batch transaction** (`$transaction([...array ops])`): semua operasi dikalkulasi terlebih dahulu di luar transaksi (pure JS, tidak ada DB roundtrip), lalu dikirim ke database sekaligus dalam satu batch. Non-interactive transaction tidak memiliki batas 5000ms.
  - Tambahan optimasi **agregasi poin/saldo per nasabah**: jika satu nasabah punya lebih dari satu setoran dalam batch yang sama, poin/saldo-nya kini digabungkan (`poinAggr[nasabahId] += totalValue`) sehingga hanya satu `UPDATE nasabah` per nasabah, bukan satu per setoran. Ini mengurangi jumlah query secara signifikan.
  - Urutan operasi dalam batch: semua `SetorLangsung.update` → semua `Nasabah.update` (per nasabah unik) → semua `MutasiSaldo.create` (per setoran, agar riwayat tetap detail).

- **Optimasi True Bulk Query pada Batch Verifikasi Setor Langsung (Tahap 2)**:
  - Mengidentifikasi bahwa non-interactive `$transaction([...])` sebelumnya masih menghasilkan ~100 SQL statement individual (49 UPDATE + 49 INSERT + 2 UPDATE), seluruhnya diselesaikan dalam satu roundtrip ~4.8 detik — terlalu lama untuk UX yang baik.
  - Ganti 49 individual `SetorLangsung.update` dengan **1 raw SQL** `UPDATE "setor_langsung" FROM (VALUES ...) AS v WHERE s.id = v.id` menggunakan `Prisma.sql` tagged template dan `Prisma.join()`. Database PostgreSQL memproses satu pernyataan UPDATE ini sekaligus untuk semua baris.
  - Ganti 49 individual `MutasiSaldo.create` dengan **1 `prisma.mutasiSaldo.createMany()`** yang menghasilkan satu `INSERT INTO ... VALUES (...), (...), ...` statement.
  - `Nasabah.update` tetap individual karena sudah teragregasi per nasabah unik (biasanya hanya 1–5 update) dan harus menjaga atomisitas increment per nasabah.
  - Hasil akhir: batch verifikasi 49 item kini hanya membutuhkan **~5 SQL statements total** (1 raw UPDATE + N nasabah update + 1 createMany), dibanding ~100 sebelumnya.

- **Pagination & Filter Tabungan Nasabah (Dashboard Admin)**:
  - Mengimplementasikan server-side pagination, pencarian nama/NIK/rekening nasabah, serta filter kategori nasabah pada modul **Tabungan Nasabah** (`/dashboard-admin/tabungan-nasabah/tabungan`) untuk optimasi performa dan kenyamanan navigasi.
  - Memindahkan perhitungan statistik global (`totalPoin`, `totalSaldo`, `totalSetoranSelesai`, `nasabahAktif`) langsung ke query database agregat di sisi server.
  - Menggunakan query teroptimasi `findMany` dengan inArray ID nasabah terfilter untuk mencegah kelebihan pemuatan data relasional (`setorLangsung`, `setorEkspedisi`, `mutasiSaldo`).
  - Menambahkan *inline loading spinner* di dalam body tabel untuk mempertahankan layout visual yang mulus tanpa geseran tata letak (*layout shift*), dan pagination footer premium yang intuitif.
