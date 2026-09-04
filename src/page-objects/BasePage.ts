import fs from "node:fs";
import path from "node:path";
import { type Locator, type Page, expect } from "@playwright/test";
import { getEnvironmentConfig } from "../config/environmentResolver";

/**
 * Shared Page Object base — navigation, waits, and safe interactions.
 * Screen pages extend this; reusable widgets live under `src/page-objects/components/`.
 *
 * Prefer returning locators / booleans from pages over expect* helpers
 * for new code; Playwright Test specs may assert in the spec file.
 */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  /** Absolute or path-relative navigation with a sensible default wait. */
  async goto(
    url: string,
    options?: {
      waitUntil?: "load" | "domcontentloaded" | "commit";
      timeout?: number;
    },
  ): Promise<void> {
    await this.page.goto(url, {
      waitUntil: options?.waitUntil ?? "domcontentloaded",
      timeout: options?.timeout,
    });
  }

  /** Wait until locator is visible (auto-wait replacement for fixed sleeps). */
  async waitForVisible(locator: Locator, timeout = 15_000): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  /** Click after visible — preferred over raw page.click in page objects. */
  async safeClick(locator: Locator, timeout = 15_000): Promise<void> {
    await this.waitForVisible(locator, timeout);
    await locator.click();
  }

  /** Visible text content of a locator. */
  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.innerText()).trim();
  }

  async takeScreenshot(filePath: string, fullPage = true): Promise<void> {
    await this.page.screenshot({ path: filePath, fullPage });
  }

  /** @deprecated Prefer asserting URL in the step/spec. Kept for existing callers. */
  async expectUrlMatches(pattern: RegExp, timeout = 15_000): Promise<void> {
    await expect(this.page).toHaveURL(pattern, { timeout });
  }

  /** @deprecated Prefer waitForVisible + step assert. Kept for existing callers. */
  async expectVisible(locator: Locator, timeout = 15_000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /** Resolve Loyalty base URL from getEnvironmentConfig() (TEST_ENV + optional BASE_URL override). */
  protected loyaltyBaseUrl(): string {
    return getEnvironmentConfig().baseUrl;
  }
}

/** Ensure failure artifact directories exist. */
export function ensureReportDirs(): void {
  for (const dir of ["reports/screenshots", "reports/traces", "reports/logs"]) {
    fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
  }
}
