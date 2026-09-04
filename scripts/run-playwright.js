/**
 * Cross-platform Playwright launcher.
 *
 * - Preserves TEST_ENV when already set on the shell (npm scripts must NOT
 *   hardcode cross-env TEST_ENV=qa before calling this script).
 * - Defaults to qa when TEST_ENV is unset.
 * - Validates TEST_ENV before spawning Playwright (dev | qa | uat only).
 */
"use strict";

const { spawnSync } = require("node:child_process");

const ALLOWED = ["dev", "qa", "uat"];
const DEFAULT = "qa";
const LEGACY_HINTS = { prod: "uat", production: "uat" };

function normalizeTestEnv() {
  const raw = process.env.TEST_ENV?.trim();
  if (!raw) {
    process.env.TEST_ENV = DEFAULT;
    return;
  }

  const normalized = raw.toLowerCase();
  if (ALLOWED.includes(normalized)) {
    process.env.TEST_ENV = normalized;
    return;
  }

  const hint = LEGACY_HINTS[normalized];
  const suffix = hint
    ? ` Did you mean TEST_ENV=${hint}? (prod was renamed to uat.)`
    : "";

  console.error(
    `[run-playwright] Invalid TEST_ENV="${raw}". Allowed: ${ALLOWED.join(", ")}.${suffix}`,
  );
  process.exit(1);
}

function main() {
  normalizeTestEnv();

  const playwrightArgs = ["playwright", "test", ...process.argv.slice(2)];

  // Windows: spawnSync(".cmd") without shell:true throws EINVAL — use npx + shell.
  const result = spawnSync("npx", playwrightArgs, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (result.error) {
    console.error(`[run-playwright] Failed to spawn Playwright: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
