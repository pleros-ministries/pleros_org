import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for transactional database writes.");
}

const globalForTransactions = globalThis as typeof globalThis & {
  plerosTransactionPool?: Pool;
};

const pool =
  globalForTransactions.plerosTransactionPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalForTransactions.plerosTransactionPool = pool;
}

export const transactionDb = drizzle(pool, { schema });
