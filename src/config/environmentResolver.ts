import { loadDotEnv } from "./dotenv";
import devConfig from "./environments/dev.config";
import qaConfig from "./environments/qa.config";
import uatConfig from "./environments/uat.config";
import type {
  EnvironmentConfig,
  ResolvedEnvironmentConfig,
  TestEnvironment,
} from "./types";

/** Single default used everywhere when TEST_ENV is unset (scripts, resolver, Allure, docs). */
export const DEFAULT_TEST_ENV: TestEnvironment = "qa";

const ALLOWED_ENVIRONMENTS: readonly TestEnvironment[] = ["dev", "qa", "uat"];

const ENV_CONFIGS: Record<TestEnvironment, EnvironmentConfig> = {
  dev: devConfig,
  qa: qaConfig,
  uat: uatConfig,
};

const LEGACY_ENV_HINTS: Record<string, TestEnvironment> = {
  prod: "uat",
  production: "uat",
};

let cachedConfig: ResolvedEnvironmentConfig | undefined;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/**
 * Resolve TEST_ENV → typed config. Defaults to DEFAULT_TEST_ENV when unset.
 * Throws on unrecognized values (no silent fallback to dev/qa).
 */
export function resolveTestEnvironment(
  rawEnv = process.env.TEST_ENV ?? process.env.ENV,
): TestEnvironment {
  const normalized = rawEnv?.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_TEST_ENV;
  }

  if (ALLOWED_ENVIRONMENTS.includes(normalized as TestEnvironment)) {
    return normalized as TestEnvironment;
  }

  const legacyHint = LEGACY_ENV_HINTS[normalized];
  const hintText = legacyHint
    ? ` Did you mean TEST_ENV=${legacyHint}? (prod was renamed to uat.)`
    : "";

  throw new Error(
    `Invalid TEST_ENV="${rawEnv}". Allowed values: ${ALLOWED_ENVIRONMENTS.join(", ")}.${hintText}`,
  );
}

function resolveOtp(rawConfig: EnvironmentConfig): string {
  return (
    process.env.QA_TEST_OTP?.trim() ||
    process.env.SIGNUP_OTP?.trim() ||
    rawConfig.otp.trim() ||
    ""
  );
}

/**
 * Returns the active environment config (singleton per process).
 * Call after loadDotEnv() — invoked automatically on first access.
 */
export function getEnvironmentConfig(): ResolvedEnvironmentConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  loadDotEnv();

  const env = resolveTestEnvironment();
  const rawConfig = ENV_CONFIGS[env];
  const defaultBaseUrl = normalizeBaseUrl(rawConfig.baseUrl);

  const baseUrlFromEnv = process.env.BASE_URL?.trim();
  const baseUrlOverrideActive = Boolean(
    baseUrlFromEnv && normalizeBaseUrl(baseUrlFromEnv) !== defaultBaseUrl,
  );
  const baseUrl = normalizeBaseUrl(baseUrlFromEnv || defaultBaseUrl);

  if (!baseUrl) {
    throw new Error(
      `BASE_URL is missing for TEST_ENV=${env}. Set BASE_URL in .env or baseUrl in src/config/environments/${env}.config.ts`,
    );
  }

  process.env.BASE_URL = baseUrl;
  if (!process.env.TEST_ENV) {
    process.env.TEST_ENV = env;
  }

  cachedConfig = {
    ...rawConfig,
    env,
    defaultBaseUrl,
    baseUrlOverrideActive,
    baseUrl,
    otp: resolveOtp(rawConfig),
    convexDeployment:
      process.env.CONVEX_DEPLOYMENT?.trim() || rawConfig.convexDeployment,
  };

  return cachedConfig;
}

/** Printed once from Playwright globalSetup at the start of each test run. */
export function logEnvironmentStartup(): void {
  const config = getEnvironmentConfig();
  const label = config.env.toUpperCase();

  console.warn(`\nRunning against: ${label} (${config.baseUrl})\n`);

  if (config.baseUrlOverrideActive) {
    console.warn(
      `⚠️  BASE_URL override active: using ${config.baseUrl} instead of ${label} default ${config.defaultBaseUrl}\n`,
    );
  }
}
