import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/prisma/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const basePrisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  // ⚠️ log: ["query"] dihapus dari sini, kita handle manual di extension bawah
});

// Simpan query yang masuk dalam window waktu singkat
type QueryEntry = {
  key: string; // format: "Model.operation"
  time: number;
};

const recentQueries: QueryEntry[] = [];
const N1_THRESHOLD = 4; // berapa kali query sama = N+1
const N1_WINDOW_MS = 100; // window deteksi dalam ms

export const prisma =
  process.env.NODE_ENV === "development"
    ? basePrisma.$extends({
        query: {
          $allModels: {
            async $allOperations({ operation, model, args, query }) {
              const start = performance.now();
              const result = await query(args);
              const duration = performance.now() - start;

              const key = `${model}.${operation}`;
              const now = Date.now();

              // Bersihkan entry yang sudah di luar window
              const cutoff = now - N1_WINDOW_MS;
              while (
                recentQueries.length > 0 &&
                recentQueries[0].time < cutoff
              ) {
                recentQueries.shift();
              }

              recentQueries.push({ key, time: now });

              // Hitung duplikat dalam window
              const dupeCount = recentQueries.filter(
                (q) => q.key === key,
              ).length;

              // Log semua query (pengganti log: ["query"])
              console.log(`[DB] ${key} — ${duration.toFixed(2)}ms`);

              // Warning kalau N+1
              if (dupeCount >= N1_THRESHOLD) {
                console.warn(
                  `\n🚨 N+1 DETECTED: "${key}" dipanggil ${dupeCount}x dalam ${N1_WINDOW_MS}ms` +
                    `\n   ➜ Cek apakah ada loop yang memanggil query ini per item` +
                    `\n   ➜ Fix: gunakan include/select atau findUnique + fluent API\n`,
                );
              }

              return result;
            },
          },
        },
      })
    : basePrisma;
