import os from "node:os";
import { defineConfig, devices } from "@playwright/test";
import { getEnvironmentConfig } from "./src/config/environmentResolver";
import { vercelBypassHttpHeaders } from "./src/utils/vercelProtectionBypass";

const config = getEnvironmentConfig();

const uiTestDir = "./tests/ui";

/** Headed locally by default; headless when HEADLESS=true or CI (unless HEADED=true). */
function shouldRunHeadless(): boolean {
  if (process.env.HEADED === "true") return false;
  if (process.env.HEADLESS === "true") return true;
  return !!process.env.CI;
}

/**
 * Playwright Test runner — UI specs under tests/ui (chromium only);
 * API folder reserved (empty).
 */
export default defineConfig({
  globalSetup: "./tests/global-setup.ts",
  timeout: 180_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.PARALLEL_WORKERS
    ? Number(process.env.PARALLEL_WORKERS)
    : 1,
  outputDir: "test-results",
  reporter: [
    ["list"],
    [
      "allure-playwright",
      {
        resultsDir: "reports/allure-results",
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          node_version: process.version,
          browser: "chromium",
          test_env: config.env,
        },
      },
    ],
  ],
  use: {
    baseURL: config.baseUrl,
    extraHTTPHeaders: vercelBypassHttpHeaders(),
    headless: shouldRunHeadless(),
    // Traces cover most debugging needs cheaply (and still attach to Allure on
    // failure). Video is opt-in via PW_VIDEO=on — e.g. a manual workflow_dispatch
    // with enable_video — for animation/drag-drop bugs where seeing motion matters.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.PW_VIDEO === "on" ? "retain-on-failure" : "off",
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      testDir: uiTestDir,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "api",
      testDir: "./tests/api",
      // Request-only suites — no browser device.
    },
  ],
});
