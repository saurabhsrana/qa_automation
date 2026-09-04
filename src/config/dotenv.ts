import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

/**
 * Load `.env` from repo root when present.
 * Does not override variables already set on the shell (dotenv default).
 */
export function loadDotEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
