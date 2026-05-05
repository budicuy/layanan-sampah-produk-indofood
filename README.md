# 🏦 Bank Sampah

Platform digital pengelolaan sampah modern berbasis web, dibangun untuk membantu masyarakat mengelola sampah secara efisien dan mendapatkan reward.

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
git clone  https://github.com/budicuy/layanan-sampah-produk-indofood.git
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
    components/          # Components untuk admin dashboard
    master-data/        # CRUD pages (nasabah, produk, ekspedisi, dll)
    pendataan/          # Fitur setor sampah & laporan
    tabungan-nasabah/   # Manajemen tabungan konsumen
  dashboard-konsumen/
    components/         # Components untuk konsumen dashboard
    setor-sampah/       # Form setor sampah konsumen
  login/
    auth/
      index.ts          # JWT signing & verification
      cookies.ts        # Cookie management
      session.ts        # Session retrieval
    actions.ts          # Server actions (login, logout)
    page.tsx            # Halaman Login
  api/                  # API routes
  layout.tsx            # Root layout
  page.tsx              # Halaman Landing page
  globals.css           # Global CSS (Tailwind CSS)
lib/
  prisma.ts             # Prisma Client
  auth-cookies.ts       # [DEPRECATED] - Moved to app/login/auth/cookies.ts
  session.ts            # [DEPRECATED] - Moved to app/login/auth/session.ts
  auth.ts               # [DEPRECATED] - Moved to app/login/auth/index.ts
prisma/
  generated/            # Generated Prisma Client (auto-generated)
  migrations/           # Database migration files
  schema.prisma         # Database schema
  seed.ts               # Script seeder untuk generate data user dll
public/                 # File statis (favicon, robots.txt, images dll)
package.json            # Package yang di install
next.config.ts          # Next.js configuration
tsconfig.json           # TypeScript configuration
proxy.ts                # Middleware untuk proteksi route & session
```

## 🔑 Akun Default

Jalankan `bun run db:seed` untuk membuat akun berikut (Konfigurasi ada di `prisma/seed.ts`):

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `password` |

## 🛠️ Perintah Pengembangan

```bash
# Jalankan development server
bun dev

# Sinkronisasi database
bun prisma db push

# Generate Prisma client
bun run db:generate

# Seed data awal
bun run db:seed

# Linting & Formatting
bun lint
```
