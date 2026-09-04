import os from "node:os";
import { defineConfig, devices } from "@playwright/test";
import { getEnvironmentConfig } from "./src/config/environmentResolver";
import { shouldRunHeadless } from "./src/config/browser.factory";

const config = getEnvironmentConfig();

const uiTestDir = "./tests/ui";

/** WebKit is opt-in only (`INCLUDE_WEBKIT=true` / `npm run test:webkit`) — Vercel blocks headless WebKit. */
const uiProjects = [
  {
    name: "chromium",
    testDir: uiTestDir,
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "firefox",
    testDir: uiTestDir,
    use: { ...devices["Desktop Firefox"] },
  },
];

if (process.env.INCLUDE_WEBKIT === "true") {
  uiProjects.push({
    name: "webkit",
    testDir: uiTestDir,
    use: { ...devices["Desktop Safari"] },
  });
}

/**
 * Playwright Test runner — UI specs under tests/ui (chromium + firefox by default);
 * API folder reserved (empty). WebKit: set INCLUDE_WEBKIT=true or npm run test:webkit.
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
          browser: process.env.BROWSER || "chromium",
          test_env: config.env,
        },
      },
    ],
  ],
  use: {
    baseURL: config.baseUrl,
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
    ...uiProjects,
    {
      name: "api",
      testDir: "./tests/api",
      // Request-only suites — no browser device.
    },
  ],
});
