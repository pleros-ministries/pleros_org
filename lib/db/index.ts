import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { plerosPool?: Pool };

// One long-lived pool for the whole Node server (Railway runs a single process).
// Dev hot reloads reuse it instead of opening new connections each time.
export const pool =
  globalForDb.plerosPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.plerosPool = pool;
}

export const db = drizzle(pool, { schema });
