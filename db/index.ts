import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

let _sql: NeonQueryFunction<false, false> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getSql() {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Make sure to set it in your Vercel project settings."
      );
    }
    _sql = neon(databaseUrl);
  }
  return _sql;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getSql(), { schema });
  }
  return _db;
}

export { schema };
