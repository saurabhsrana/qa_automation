/**
 * Reads baseUrl/otp from src/config/environments/*.config.ts for CommonJS tooling
 * (allurerc.cjs, allure-prepare-metadata.js) without a TypeScript runtime.
 */
const fs = require("node:fs");
const path = require("node:path");

const ALLOWED = ["dev", "qa", "uat"];
const DEFAULT = "qa";
const LEGACY_HINTS = { prod: "uat", production: "uat" };

function resolveTestEnvironment(rawEnv = process.env.TEST_ENV || process.env.ENV) {
  const normalized = rawEnv?.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT;
  }

  if (ALLOWED.includes(normalized)) {
    return normalized;
  }

  const hint = LEGACY_HINTS[normalized];
  const suffix = hint
    ? ` Did you mean TEST_ENV=${hint}? (prod was renamed to uat.)`
    : "";

  throw new Error(
    `Invalid TEST_ENV="${rawEnv}". Allowed values: ${ALLOWED.join(", ")}.${suffix}`,
  );
}

function readEnvFile(envName) {
  const resolved = resolveTestEnvironment(envName);
  const filePath = path.join(
    __dirname,
    "..",
    "src",
    "config",
    "environments",
    `${resolved}.config.ts`,
  );
  const content = fs.readFileSync(filePath, "utf8");
  const baseUrl =
    content.match(/baseUrl:\s*"([^"]+)"/)?.[1]?.replace(/\/$/, "") || "";
  const otp = content.match(/otp:\s*"([^"]+)"/)?.[1] || "";
  return { baseUrl, otp, envName: resolved };
}

function resolveBaseUrl() {
  const fromEnv = process.env.BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return readEnvFile(process.env.TEST_ENV).baseUrl;
}

function resolveOtp() {
  const fromEnv =
    process.env.QA_TEST_OTP?.trim() || process.env.SIGNUP_OTP?.trim() || "";
  if (fromEnv) return fromEnv;
  return readEnvFile(process.env.TEST_ENV).otp;
}

module.exports = {
  DEFAULT_TEST_ENV: DEFAULT,
  readEnvFile,
  resolveBaseUrl,
  resolveOtp,
  resolveTestEnvironment,
};
