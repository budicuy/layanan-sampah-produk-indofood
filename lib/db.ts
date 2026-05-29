import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

// Simpan query yang masuk dalam window waktu singkat untuk deteksi N+1
type QueryEntry = {
  sql: string;
  time: number;
};
const recentQueries: QueryEntry[] = [];
const N1_THRESHOLD = 4;
const N1_WINDOW_MS = 100;

class MyLogger {
  logQuery(query: string, _params: unknown[]): void {
    if (process.env.NODE_ENV === "development") {
      const now = Date.now();
      const cutoff = now - N1_WINDOW_MS;
      while (recentQueries.length > 0 && recentQueries[0].time < cutoff) {
        recentQueries.shift();
      }

      recentQueries.push({ sql: query, time: now });

      const dupeCount = recentQueries.filter((q) => q.sql === query).length;
      console.log(
        `[DB Query] ${query.substring(0, 120)}${query.length > 120 ? "..." : ""}`,
      );

      if (dupeCount >= N1_THRESHOLD) {
        console.warn(
          `\n🚨 N+1 DETECTED (Drizzle): Query yang sama dipanggil ${dupeCount}x dalam ${N1_WINDOW_MS}ms` +
            `\n   ➜ Query: ${query.substring(0, 200)}...\n`,
        );
      }
    }
  }
}

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development" ? new MyLogger() : false,
});
export type DbClient = typeof db;
