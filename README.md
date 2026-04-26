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
| Autentikasi | Better Auth |
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
# Buat file .env dari .env.example atau jalankan perintah
DATABASE_URL="" # database neon bisa cek di https://neon.tech/
BETTER_AUTH_SECRET="" # secret better auth teks random 32 karakter
BETTER_AUTH_URL="http://localhost:3000" # url better auth untuk local development
```

## 📁 Struktur Proyek

```text
app/
  actions/
    auth.ts             # Server Actions (login, logout)
  api/auth/[...all]/
    route.ts            # Better Auth API handler
  dashboard/
    page.tsx            # Halaman Dashboard
  login/
    page.tsx            # Halaman Login
  layout.tsx            # Root layout
  page.tsx              # Halaman Landing page
lib/
  auth.ts               # Konfigurasi Better Auth
  prisma.ts             # Prisma Client
prisma/
  schema.prisma         # Schema / Tabel Database
  seed.ts               # Script seeder untuk generate data user dll
proxy.ts                # Middleware untuk proteksi route & session
```

## 🔑 Akun Default

Jalankan `bun run db:seed` untuk membuat akun berikut:

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
