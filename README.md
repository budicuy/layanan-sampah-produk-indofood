# 🏦 SICUAN (Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai)

Platform digital pengelolaan sampah modern berbasis web, dibangun untuk membantu masyarakat mengelola sampah secara efisien dan mendapatkan reward poin yang dapat ditabung.

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