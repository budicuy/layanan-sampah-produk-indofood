# 🏦 Bank Sampah

Platform digital pengelolaan sampah modern berbasis web, dibangun untuk membantu masyarakat mengelola sampah secara efisien dan mendapatkan reward.

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Autentikasi | Better Auth (username + password) |
| Linting | Biome |

## 🚀 Memulai

```bash
# Install dependencies
bun install

# Jalankan development server
bun dev
```

## 🗄️ Database

```bash
# Push schema ke database
bun run db:push

# Seed user awal (budi / budi)
bun run db:seed
```

## 📁 Struktur Proyek

```
app/
  page.tsx              # Landing page
  layout.tsx            # Root layout
  login/
    page.tsx            # Halaman login
    actions.ts          # Server Action login
  dashboard/
    layout.tsx          # Layout dashboard (sidebar)
    page.tsx            # Overview dashboard
  api/auth/[...all]/
    route.ts            # Better Auth API handler
lib/
  auth.ts               # Konfigurasi Better Auth
  db/
    index.ts            # Koneksi Drizzle + Postgres
    schema.ts           # Schema tabel database
scripts/
  seed.ts               # Seeder user awal
```

## 🔑 Akun Default

| Field | Value |
|---|---|
| Username | `budi` |
| Password | `budi` |
