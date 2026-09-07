/**
 * Writes Allure metadata into reports/allure-results before `allure generate`.
 *
 * Classic files (executor.json, environment.properties, categories.json) remain
 * useful for adapters / tooling; Allure 3 also picks up environment-style data
 * via allurerc `variables` and `categories.rules` (see allurerc.cjs).
 *
 * Env (optional overrides - CI sets these):
 *   GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_RUN_NUMBER
 *   ALLURE_REPORT_URL, ALLURE_BROWSERS, ALLURE_OS, ALLURE_BASE_URL_DISPLAY, ALLURE_NODE
 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { resolveBaseUrl } = require("./resolve-env-config.js");

const ROOT = path.resolve(__dirname, "..");
const RESULTS = path.join(ROOT, "reports", "allure-results");
const HISTORY_DIR = path.join(ROOT, "reports", "allure-history");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function githubPagesUrl() {
  const repo = process.env.GITHUB_REPOSITORY || "";
  const [owner, name] = repo.split("/");
  if (owner && name) {
    return `https://${owner}.github.io/${name}/`;
  }
  return process.env.ALLURE_REPORT_URL || "";
}

function writeExecutor() {
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY || "local/repo";
  const runId = process.env.GITHUB_RUN_ID || "0";
  const runNumber = process.env.GITHUB_RUN_NUMBER || "0";
  const buildUrl = `${server}/${repo}/actions/runs/${runId}`;
  const reportUrl = process.env.ALLURE_REPORT_URL || githubPagesUrl() || buildUrl;

  const executor = {
    name: "GitHub Actions",
    type: "github",
    url: `${server}/${repo}/actions`,
    buildOrder: Number(runNumber) || 0,
    buildName: `CI #${runNumber}`,
    buildUrl,
    reportName: "Allure Report",
    reportUrl,
  };

  fs.writeFileSync(
    path.join(RESULTS, "executor.json"),
    `${JSON.stringify(executor, null, 2)}\n`,
    "utf8",
  );
  console.log("Wrote reports/allure-results/executor.json");
}

function writeEnvironment() {
  const lines = [
    `Browsers=${process.env.ALLURE_BROWSERS || "chromium"}`,
    `OS=${process.env.ALLURE_OS || process.env.RUNNER_OS || os.platform()}`,
    `Base_URL=${process.env.ALLURE_BASE_URL_DISPLAY || resolveBaseUrl() || "(configured via TEST_ENV)"}`,
    `Node=${process.env.ALLURE_NODE || process.version}`,
    `CI=${process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "local"}`,
    `Branch=${process.env.GITHUB_REF_NAME || "local"}`,
    `Run=${process.env.GITHUB_RUN_NUMBER || "n/a"}`,
  ];

  const envPath = path.join(RESULTS, "environment.properties");
  // Preserve any environment.properties already emitted by allure-playwright, then append ours.
  let existing = "";
  if (fs.existsSync(envPath)) {
    existing = fs.readFileSync(envPath, "utf8").trimEnd();
    if (existing) existing += "\n";
  }
  fs.writeFileSync(envPath, `${existing}${lines.join("\n")}\n`, "utf8");
  console.log("Wrote reports/allure-results/environment.properties");
}

function writeCategories() {
  const categories = [
    {
      name: "Product defects",
      matchedStatuses: ["failed"],
      messageRegex:
        ".*([Ee]xpect|assertion|toBe|toEqual|toContain|Received:|Expected:).*",
    },
    {
      name: "Test defects",
      matchedStatuses: ["broken", "failed"],
      messageRegex:
        ".*(Timeout|timeout|waiting for|locator\\.|strict mode violation|not found|not visible|Target closed).*",
    },
  ];

  fs.writeFileSync(
    path.join(RESULTS, "categories.json"),
    `${JSON.stringify(categories, null, 2)}\n`,
    "utf8",
  );
  console.log("Wrote reports/allure-results/categories.json");
}

function ensureHistoryDir() {
  ensureDir(HISTORY_DIR);
  const historyFile = path.join(HISTORY_DIR, "history.jsonl");
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, "", "utf8");
  }
  console.log(`Allure 3 history file: ${historyFile}`);
}

function main() {
  ensureDir(RESULTS);
  ensureHistoryDir();
  writeExecutor();
  writeEnvironment();
  writeCategories();
  console.log("Allure metadata ready - run npm run allure:generate next.");
}

main();
