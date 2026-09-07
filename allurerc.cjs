/**
 * Allure 3 config.
 *
 * Uses the `allure2` plugin so the published `index.html` opens on the classic
 * Overview dashboard (Trend / Environment / Executors / Categories) — matching
 * the Allure 2 home page — instead of the suites-only Awesome tree.
 *
 * - `historyPath` (JSONL) enables multi-run Trend charts across CI builds.
 * - `categories.rules` buckets failures (Product vs Test defects).
 * - `variables` populate the Environment widget (CI overrides via env).
 * - Classic files written by scripts/allure-prepare-metadata.js
 *   (executor.json, environment.properties, categories.json) feed Executors /
 *   Environment and remain useful for tooling.
 * - `singleFile: true` keeps file:// / artifact unzip viewing working.
 */
const { resolveBaseUrl } = require("./scripts/resolve-env-config.js");

module.exports = {
  output: "reports/allure-report",
  name: "Allure Report",
  historyPath: "reports/allure-history/history.jsonl",
  appendHistory: true,
  historyLimit: 30,
  categories: {
    rules: [
      {
        id: "product-defects",
        name: "Product defects",
        matchers: {
          statuses: ["failed"],
          message:
            /expect|assertion|toBe|toEqual|toContain|Received:|Expected:/i,
        },
      },
      {
        id: "test-defects",
        name: "Test defects",
        matchers: {
          statuses: ["failed", "broken"],
          message:
            /Timeout|timeout|waiting for|locator\.|strict mode|not found|not visible|Target closed/i,
        },
      },
    ],
  },
  variables: {
    Browsers: process.env.ALLURE_BROWSERS || "chromium",
    OS: process.env.ALLURE_OS || process.env.RUNNER_OS || process.platform,
    Base_URL:
      process.env.ALLURE_BASE_URL_DISPLAY ||
      resolveBaseUrl() ||
      "(configured via TEST_ENV)",
    Node: process.env.ALLURE_NODE || process.version,
    CI: process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "local",
    Branch: process.env.GITHUB_REF_NAME || "local",
    Run: process.env.GITHUB_RUN_NUMBER || "n/a",
  },
  plugins: {
    // Classic Overview landing (default tab). Do not enable awesome alone —
    // its default tree view looked like "Suites only" without Overview widgets.
    allure2: {
      options: {
        singleFile: true,
        reportLanguage: "en",
      },
    },
  },
};
