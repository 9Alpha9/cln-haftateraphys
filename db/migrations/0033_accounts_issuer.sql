-- Catch-up migration: better-auth `issuer` column was present in the schema
-- snapshot but missing from the generated SQL history.
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "issuer" text;
