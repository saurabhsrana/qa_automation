import type { BrowserContext } from "@playwright/test";
import { getEnvironmentConfig } from "../config/environmentResolver";

export const VERCEL_PROTECTION_BYPASS_HEADER = "x-vercel-protection-bypass";
export const VERCEL_SET_BYPASS_COOKIE_HEADER = "x-vercel-set-bypass-cookie";

/**
 * Automation bypass secret.
 *
 * Verified 2026-09-07: QA and UAT share a single Vercel project, so one
 * VERCEL_PROTECTION_BYPASS_KEY covers both environments. If QA/UAT are ever split
 * into separate Vercel projects, this will need per-environment keys (see Convex's
 * CONVEX_DEPLOY_KEY_QA / _UAT pattern for reference).
 *
 * Local: missing key → no-op (public URL). CI: missing key → throw (do not
 * continue into a Vercel login wall that looks like a flake).
 */
export function getVercelProtectionBypassKey(): string {
  const key = process.env.VERCEL_PROTECTION_BYPASS_KEY?.trim() || "";
  if (!key && process.env.CI === "true") {
    throw new Error(
      "[vercel] VERCEL_PROTECTION_BYPASS_KEY is not set in CI. " +
        "Add the GitHub Actions secret VERCEL_PROTECTION_BYPASS_KEY " +
        "(Vercel → Project Settings → Deployment Protection → " +
        "Protection Bypass for Automation).",
    );
  }
  return key;
}

/** Headers for Playwright `use.extraHTTPHeaders` and request interception. */
export function vercelBypassHttpHeaders(): Record<string, string> {
  const key = getVercelProtectionBypassKey();
  if (!key) {
    return {};
  }
  return {
    [VERCEL_PROTECTION_BYPASS_HEADER]: key,
    [VERCEL_SET_BYPASS_COOKIE_HEADER]: "true",
  };
}

/**
 * First document navigations sometimes miss extraHTTPHeaders.
 * Append Vercel’s documented query params so the bypass cookie is set.
 */
export function withVercelBypassQuery(url: string): string {
  const key = getVercelProtectionBypassKey();
  if (!key || url.includes(`${VERCEL_PROTECTION_BYPASS_HEADER}=`)) {
    return url;
  }

  const absolute = /^https?:\/\//i.test(url);
  const parsed = new URL(url, "https://vercel-bypass.invalid");
  parsed.searchParams.set(VERCEL_PROTECTION_BYPASS_HEADER, key);
  parsed.searchParams.set(VERCEL_SET_BYPASS_COOKIE_HEADER, "true");
  if (absolute) {
    return parsed.toString();
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function shouldAttachBypass(requestUrl: string, loyaltyHost: string): boolean {
  try {
    const host = new URL(requestUrl).host;
    return host === loyaltyHost;
  } catch {
    return false;
  }
}

/**
 * Fallback: inject bypass headers on every request to the Loyalty origin
 * (covers document reloads that may not reuse extraHTTPHeaders).
 */
export async function installVercelBypassRoute(
  context: BrowserContext,
): Promise<void> {
  const key = getVercelProtectionBypassKey();
  if (!key) {
    return;
  }

  const loyaltyHost = new URL(getEnvironmentConfig().baseUrl).host;
  const bypassHeaders = vercelBypassHttpHeaders();

  await context.route("**/*", async (route, request) => {
    if (!shouldAttachBypass(request.url(), loyaltyHost)) {
      await route.continue();
      return;
    }
    await route.continue({
      headers: {
        ...request.headers(),
        ...bypassHeaders,
      },
    });
  });
}
