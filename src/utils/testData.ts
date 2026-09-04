/**
 * Dynamic test-data helpers. Static values live in `src/data/constants.json`.
 */
import { getEnvironmentConfig } from "../config/environmentResolver";
import constants from "../data/constants.json";

/** UNIQUE → fresh 10-digit test phone so signup is not skipped for an existing account. */
export function resolveUniquePhone(phone: string): string {
  if (!/^unique$/i.test(phone.trim())) return phone;
  const suffix = Date.now().toString().slice(-9);
  return `9${suffix}`;
}

/** Keep john.doe@test.com unique per run using the last 8 phone digits. */
export function uniqueEmailForPhone(email: string, phone?: string): string {
  if (phone && /^john\.doe@test\.com$/i.test(email)) {
    return `john.doe+${String(phone).replace(/\D/g, "").slice(-8)}@test.com`;
  }
  return email;
}

/**
 * Harness OTP — from getEnvironmentConfig() with optional QA_TEST_OTP / SIGNUP_OTP override.
 * SIGNUP_OTP is accepted as a legacy env alias.
 */
export function resolveTestOtp(): string {
  const { env, otp } = getEnvironmentConfig();
  const resolved = otp.trim();
  if (!resolved) {
    throw new Error(
      `OTP is not configured for TEST_ENV=${env}. Set otp in src/config/environments/${env}.config.ts or QA_TEST_OTP in .env.`,
    );
  }
  return resolved;
}

/** Welcome page expected heading (from constants.json). */
export const welcomeHeading = constants.welcome.heading;

/** Former completeprofile Examples row — static payload from constants.json. */
export const profileDataSets = constants.profileDataSets;
