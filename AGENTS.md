<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 🏦 Bank Sampah (Waste Management Platform) — AI Coding Agent Guide

**Project**: Dual-dashboard waste bank service using Next.js 16, TypeScript, Prisma, PostgreSQL (Neon), JWT Auth, and Biome linting.

See [README.md](README.md) for setup, tech stack, and environment configuration.

---

## 🏗️ Architecture Overview

This is a **role-based, dual-dashboard application**:

- **Admin Dashboard** (`/dashboard-admin`): Master data CRUD (consumers, products, drivers, pricing), waste submission processing, balance management
- **Consumer Dashboard** (`/dashboard-konsumen`): Submit waste, track collection status, view balance
- **Role-Based Routing**: Middleware (`proxy.ts`) redirects users at Edge level based on JWT role (KONSUMEN, ADMIN, HRD)
- **Data Mutations**: All changes go through **Server Actions** in `[feature]/actions.ts` files
- **Session Management**: JWT in httpOnly cookie; retrieve via `getSession()` (Edge-compatible)

---

## 🗄️ Database & Prisma Schema

**Key Entities**:

- `User` → `Account` (password: bcrypt hash)
- `User` → `Nasabah` (consumer profile: saldo, mutasi history)
- `Nasabah` → `SetorSampah` (waste submissions with 7-stage workflow)
- `Nasabah` → `MutasiSaldo` (transaction ledger; links to SetorSampah via `referensiId`)
- `Ekpedisi` (delivery drivers) → assigned to `SetorSampah`
- `Produk` (waste types) + `HargaSampah` (monthly pricing)

**SetorSampah Workflow** (7 stages — core business logic):

1. **MENUNGGU_VERIFIKASI** — Consumer submits waste details
2. **TERVERIFIKASI** — Admin approves/validates submission
3. **DITOLAK** — Admin rejects submission
4. **DALAM_PENJEMPUTAN** — Driver assigned, en route to pickup
5. **SUDAH_DISERAHKAN** — Consumer confirms handoff to driver
6. **SAMPAH_DITERIMA** — Admin confirms arrival at waste center
7. **SELESAI** — Balance credited; transaction complete

**Critical Details**:
- `MutasiSaldo.referensiId` → `SetorSampah.id` (audit trail)
- Indexes on `(nasabahId, status)`, `status`, `selesaiAt` (query optimization)
- Prisma client auto-generated at `prisma/generated/prisma/client`

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

**Auth Flow**:
1. Login form submits username + password
2. `loginAction` validates against bcrypt `Account.password`
3. Checks user status is AKTIF
4. Signs JWT + sets httpOnly cookie
5. Returns role → frontend redirects to appropriate dashboard

**Example Auth Check in Server Action**:
```typescript
async function checkAdminAuth() {
  const session = await getSession();
  if (!session || session.user.role === "KONSUMEN") {
    throw new Error("Unauthorized: Admin or HRD access required");
  }
}
```

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

### Components & Forms

- **Pages**: Usually `"use client"` with `useState` + fetch data via Server Action
- **Layouts**: Server Components; check auth and redirect unauthorized users
- **Forms**: Use native `FormData` API:
  ```typescript
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await serverAction(formData);
  }
  ```
- **Icons**: Lucide React (`lucide-react`)
- **Toasts**: `react-hot-toast` for notifications
- **Styling**: Tailwind CSS 4 + custom theme in [app/globals.css](app/globals.css)

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
5. **Neon Adapter**: `@prisma/adapter-neon` for serverless connection pooling
6. **Middleware**: Project uses `proxy.ts` (verify wiring in `next.config.ts`)
7. **Tailwind CSS 4**: `@theme inline` directives; `@tailwindcss/postcss` required
8. **Biome Linting**: Single tool for format + lint; run `bun run lint` (writes fixes)

---

## 🛠️ Quick Commands

```bash
# Development
bun dev                    # Start dev server (http://localhost:3000)
bun run db:seed           # Seed default data
bun run db:push           # Sync Prisma schema to DB
bun run db:generate       # Regenerate Prisma client after schema changes
bun run lint              # Format + lint with Biome (writes fixes)
bun run format            # Format code only

# Production
bun run build             # Build production bundle
bun start                 # Start production server
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

---

## 📂 Directory Structure Guide

- **`app/`** — Next.js App Router (pages, layouts, API routes)
  - `dashboard-admin/` — Admin panel with master data CRUD and processing
  - `dashboard-konsumen/` — Consumer panel for waste submission
  - `login/` — Authentication (pages, auth utilities)
- **`prisma/`** — Prisma schema, migrations, seed scripts
  - `generated/` — Auto-generated Prisma client (read-only)
- **`lib/`** — Shared utilities (Prisma client singleton)
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

---

**Last updated**: May 2026