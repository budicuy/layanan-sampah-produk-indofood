<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 🏦 SICUAN (Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai) — AI Coding Agent Guide

**Project**: Dual-dashboard waste bank service using Next.js 16, TypeScript, Prisma, PostgreSQL (Neon), JWT Auth, and Biome linting.

See [README.md](README.md) for setup, tech stack, and environment configuration.

---

## 🏗️ Architecture & Recent Refactors

This is a **role-based, dual-dashboard application**:

- **Admin Dashboard** (`/dashboard-admin`): Master data CRUD (consumers, drivers, pricing, users), waste submission processing, and balance/points ledgers.
- **Consumer Dashboard** (`/dashboard-konsumen`): Submit waste (langsung/ekspedisi), view points balance, and track collection/verification workflow stages.
- **Role-Based Routing**: Middleware (`proxy.ts`) redirects users at Edge level based on JWT role (`KONSUMEN`, `ADMIN`, `HRD`).
- **Data Mutations**: All changes go through **Server Actions** in `[feature]/actions.ts` files.
- **Session Management**: JWT in httpOnly cookie; retrieve via `getSession()` (Edge-compatible). Access user ID via `session.user.sub`, NOT `.user.id`.

### 🔄 Summary of Key Project Evolution & Refactors

1. **Reward Poin Migration (Points-Based Payouts)**
   - The platform migrated from currency-based payouts (Saldo/Rupiah) to point-based rewards.
   - `Nasabah` profile tracks `poin` instead of `saldo`.
   - `SetorSampah` records `poinPerKg` and `totalPoin` instead of `hargaPerKg` and `totalSaldo`.
   - `HargaSampah` (monthly reference rates) tracks points rewarded per kg in the `point` field.
   - `MutasiSaldo` represents point transactions (kredit/debit) and links to the transaction reference.

2. **Removing Price / Details from Product Data (`Produk` model)**
   - The `Produk` model was simplified and acts strictly as metadata (`kode`, `nama`, `jenis`). All price, weight, brand, and size details were removed.
   - Payout calculations dynamically fetch monthly rate limits from the `HargaSampah` table for the matching `JenisSampah` (`PLASTIK`, `KARTON`, `PAPER_CUP`) and month of submission.

3. **Simplified Folder Structure (Self-Contained Pages)**
   - To reduce folder nesting and prevent parsing/import errors, subcomponents have been merged directly into their respective `page.tsx` files.
   - Interactive modals, tables, and CRUD triggers are declared in the same file as the page layout (annotated with `"use client"` at the top), while backend queries and operations are imported from a sibling `actions.ts` file.

4. **Automatic Price/Point Verification ("Data Sudah Benar")**
   - The Admin Setor Sampah verification panel automatically loads the matching rates from `HargaSampah`.
   - Admin can click the "Data Sudah Benar" button to automatically verify and set actual weight equal to estimated weight, calculate points, lock in notes, and credit the points balance immediately.

---

## 🗄️ Database & Prisma Schema

**Key Entities**:

- `User` → `Account` (password: bcrypt hash)
- `User` → `Nasabah` (consumer profile: `poin` balance, mutasi history)
- `Nasabah` → `SetorSampah` (waste submissions with 7-stage workflow)
- `Nasabah` → `MutasiSaldo` (point transaction ledger; links to SetorSampah via `referensiId`)
- `Ekpedisi` (delivery drivers) → assigned to `SetorSampah`
- `Produk` (waste types) + `HargaSampah` (monthly pricing & points)

**SetorSampah Workflows** (Core Business Logic by `jenisSetor`):

### 1. Direct Drop-off (`LANGSUNG`) Workflow:
* **MENUNGGU_VERIFIKASI** — Consumer submits waste details and drops it off directly at the center.
* **SELESAI** (or **DITOLAK**) — Admin verifies the waste, records the actual weight (can use "Data Sudah Benar" auto-fill), calculates and credits the points directly to the consumer, and completes the transaction (direct jump from waiting to finished).

### 2. Courier Pickup (`EKSPEDISI`) Workflow:
1. **MENUNGGU_VERIFIKASI** — Consumer registers a pickup request.
2. **TERVERIFIKASI** (or **DITOLAK**) — Admin validates the request.
3. **DALAM_PENJEMPUTAN** — Admin assigns an `Ekpedisi` driver to en route to pickup.
4. **SUDAH_DISERAHKAN** — Consumer confirms they have handed over the waste to the driver.
5. **SAMPAH_DITERIMA** — Admin confirms the waste arrived at the collection center.
6. **SELESAI** — Admin weighs the waste, registers actual weight (can use "Data Sudah Benar" auto-fill), locks in monthly point rate from `HargaSampah`, and credits the points to complete the transaction.

**Schema**: [prisma/schema.prisma](prisma/schema.prisma)

---

## 🔐 Authentication (JWT + httpOnly Cookie)

**JWT Payload**:
```typescript
{ sub: userId, username, name, email, role: "KONSUMEN"|"ADMIN"|"HRD" }
```

**Cookie Management** ([app/login/auth/cookies.ts](app/login/auth/cookies.ts)):
- Token: `auth_token` (httpOnly, Secure in prod, SameSite=Strict/Lax)
- Expiry: 7 days

**Session Retrieval** ([app/login/auth/session.ts](app/login/auth/session.ts)):
- `await getSession()` → reads JWT from cookie (Edge-compatible, no Prisma)
- Returns `{ user: JwtPayload }` or `null`
- **⚠️ CRITICAL**: Access user ID via `session.user.sub`, NOT `.user.id`

---

## ⚙️ Development Patterns & Conventions

### Server Actions (Data Mutations)

All changes in `[feature]/actions.ts` files. Pattern:

```typescript
"use server";
import { getSession } from "@/app/login/auth/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized");
  }
}

export async function createEntity(data: FormData) {
  await checkAdminAuth();  // ← Always verify auth first
  
  // Validate input with Valibot
  const parsed = v.safeParse(schema, Object.fromEntries(data));
  if (!parsed.success) throw new Error("Invalid input");
  
  // Perform Prisma operation
  const result = await prisma.entity.create({ data: parsed.output });
  
  // Invalidate cache (critical for UI sync)
  revalidatePath("/dashboard-admin/path");
  
  return { success: true, data: result };
}
```

### Key Patterns

| Pattern | Usage | Location |
|---------|-------|----------|
| Auth verification | First line of server action | All `actions.ts` files |
| Cache invalidation | After every mutation | All `actions.ts` files |
| Input validation | Before DB operation | Use Valibot `v.safeParse()` |
| Role checking | Conditional rendering, route protection | Layouts, actions, `proxy.ts` |
| Session access | Get user context in server action | `await getSession()` |
| Type safety | Import enums from generated client | `@/prisma/generated/prisma/client` |
| Error handling | Actions throw `Error()`, client catches | `try/catch` + `react-hot-toast` |

---

## ⚠️ Next.js 16 Breaking Changes & Quirks

1. **React 19.2.4 + React Compiler**: Auto-memoization enabled; hooks behavior stricter
2. **Async Cookie/Header APIs**: `await cookies()` and `await headers()` are required
3. **FormData Instead of JSON**: Use native FormData API; React handles serialization
4. **Edge-Compatible Auth**: `jose` library for HS256 signing (not Node.js `jsonwebtoken`)
5. **Neon Adapter**: `@prisma/adapter-neon` for serverless connection pooling over HTTP/WS (port 443)
6. **Middleware**: Project uses `proxy.ts` (verify wiring in `next.config.ts`)
7. **Tailwind CSS 4**: `@theme inline` directives; `@tailwindcss/postcss` required
8. **Biome Linting**: Single tool for format + lint; run `bun run lint` (writes fixes)

---

## 🛠️ Quick Commands

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm run db:seed           # Seed default data (updates points & mock data)
pnpm run prisma/migrate.ts  # Push local schema changes to Neon DB via HTTP adapter (bypassing blocked TCP port 5432)
pnpm run db:generate       # Regenerate Prisma client after schema changes
pnpm run lint              # Format + lint with Biome (writes fixes)
pnpm run format            # Format code only

# Production
pnpm run build             # Build production bundle
pnpm start                 # Start production server
```

---

## 🚨 Common Gotchas & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `JWT_SECRET not set` error | Missing `.env.local` | Set `JWT_SECRET=<32-char-string>` |
| `getSession()` returns `null` | JWT cookie missing/expired | Check cookie exists; token fresh |
| Data not updating in UI | `revalidatePath()` not called | Always call after mutations |
| Import path fails | Wrong import | Use `@/*` alias (defined in tsconfig) |
| Prisma client out of sync | Schema changed without regeneration | Run `bun run db:generate` |
| Type errors on enums | Wrong import | Import from `@/prisma/generated/prisma/client` |
| Middleware not routing correctly | `proxy.ts` not wired | Check `next.config.ts` for middleware config |
| `P1001: Can't reach database server` during `db:push` | TCP port 5432 is blocked by network | Run schema migrations using Neon HTTP serverless adapter: `bun run prisma/migrate.ts` |

---

## 📂 Directory Structure Guide

- **`app/`** — Next.js App Router (pages, layouts, API routes)
  - `dashboard-admin/` — Admin panel with master data CRUD, processing, reports, and ledgers
  - `dashboard-konsumen/` — Consumer panel for waste submission and history tracking
  - `login/` — Authentication (pages, auth utilities)
- **`prisma/`** — Prisma schema, migrations, seed scripts
  - `generated/` — Auto-generated Prisma client (read-only)
- **`lib/`** — Shared utilities (Prisma client singleton using `@prisma/adapter-neon` over port 443)
- **`public/`** — Static assets

---

## 🎯 AI Agent Productivity Checklist

When implementing features, always:

✅ Check auth first — call `checkAdminAuth()` or `await getSession()`  
✅ Validate input — use Valibot schema before Prisma operation  
✅ Invalidate cache — call `revalidatePath()` after mutations  
✅ Return user context — use `session.user.sub` for userId, not `.id`  
✅ Type safely — import enums/types from generated Prisma client  
✅ Handle errors gracefully — throw errors in actions; catch on client  
✅ Test linting — run `bun run lint` to check for style/type issues  
✅ Understand the SetorSampah workflow — it's the core business logic  
✅ Remember rewards are Point-based — use `poin`, `totalPoin`, `poinPerKg`, and `point` instead of `saldo` or currency units  

---

**Last updated**: May 2026