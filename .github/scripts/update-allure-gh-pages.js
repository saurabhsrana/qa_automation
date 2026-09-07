/**
 * Mutates a gh-pages working tree:
 *   /reports/<run_number>-<short_sha>/  — this run's Allure HTML
 *   /index.html                         — catalog of last REPORTS_TO_KEEP
 *   /latest/index.html                  — redirect to the newest report
 *   /reports/manifest.json              — metadata for the catalog
 *
 * Env:
 *   GH_PAGES_DIR, ALLURE_REPORT_DIR, REPORTS_TO_KEEP
 *   GITHUB_RUN_NUMBER, GITHUB_SHA, GITHUB_REF_NAME
 *   REPORT_STATUS (playwright-ui job result), REPORT_TIMESTAMP (ISO)
 */
const fs = require("node:fs");
const path = require("node:path");

const KEEP = Math.max(1, Number(process.env.REPORTS_TO_KEEP || 5));
const siteDir = process.env.GH_PAGES_DIR || "gh-pages";
const reportDir = process.env.ALLURE_REPORT_DIR || "artifact";
const runNumber = Number(process.env.GITHUB_RUN_NUMBER || "0");
const shortSha = (process.env.GITHUB_SHA || "unknown").slice(0, 7);
const branch = process.env.GITHUB_REF_NAME || "";
const status = process.env.REPORT_STATUS || "unknown";
const timestamp =
  process.env.REPORT_TIMESTAMP || new Date().toISOString().replace(/\.\d+Z$/, "Z");

const folder = `${runNumber}-${shortSha}`;
const reportsDir = path.join(siteDir, "reports");
const manifestPath = path.join(reportsDir, "manifest.json");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (!fs.existsSync(path.join(reportDir, "index.html"))) {
  throw new Error(`Allure report missing index.html in ${reportDir}`);
}

fs.mkdirSync(reportsDir, { recursive: true });

let manifest = { reports: [] };
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    manifest = { reports: [] };
  }
}

const dest = path.join(reportsDir, folder);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(reportDir, dest, { recursive: true });
fs.writeFileSync(path.join(dest, ".nojekyll"), "");

const entry = {
  folder,
  runNumber,
  sha: shortSha,
  branch,
  timestamp,
  status,
};

manifest.reports = [
  entry,
  ...(manifest.reports || []).filter((item) => item.folder !== folder),
]
  .sort((a, b) => Number(b.runNumber) - Number(a.runNumber))
  .slice(0, KEEP);

const keepFolders = new Set(manifest.reports.map((item) => item.folder));
for (const name of fs.readdirSync(reportsDir)) {
  if (name === "manifest.json") {
    continue;
  }
  const full = path.join(reportsDir, name);
  if (!fs.statSync(full).isDirectory()) {
    continue;
  }
  if (!keepFolders.has(name)) {
    fs.rmSync(full, { recursive: true, force: true });
  }
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const latest = manifest.reports[0];
const latestHref = latest ? `./reports/${latest.folder}/` : "./";
const latestFromLatestDir = latest ? `../reports/${latest.folder}/` : "../";

const rows = manifest.reports
  .map((item, index) => {
    const label = index === 0 ? "latest" : `#${item.runNumber}`;
    return `<tr>
      <td><a href="./reports/${escapeHtml(item.folder)}/">${escapeHtml(label)}</a></td>
      <td>${escapeHtml(item.runNumber)}</td>
      <td><code>${escapeHtml(item.sha)}</code></td>
      <td>${escapeHtml(item.branch)}</td>
      <td>${escapeHtml(item.timestamp)}</td>
      <td>${escapeHtml(item.status)}</td>
    </tr>`;
  })
  .join("\n");

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Allure reports (last ${KEEP})</title>
  <style>
    body { font-family: sans-serif; max-width: 52rem; margin: 2rem auto; padding: 0 1rem; }
    a { font-weight: 600; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 0.5rem; }
    .latest { display: inline-block; margin: 1rem 0; padding: 0.6rem 1rem; background: #1f6feb; color: #fff; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Allure reports</h1>
  <p>Keeping the last ${KEEP} CI publishes. Combined Chromium + Firefox results.</p>
  <p><a class="latest" href="${escapeHtml(latestHref)}">Open latest report</a></p>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Run</th>
        <th>SHA</th>
        <th>Branch</th>
        <th>Time (UTC)</th>
        <th>Playwright</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>
`;

const keepRoot = new Set(["index.html", ".nojekyll", "CNAME", "latest", "reports", "README.md"]);
for (const name of fs.readdirSync(siteDir)) {
  if (keepRoot.has(name) || name === ".git") {
    continue;
  }
  fs.rmSync(path.join(siteDir, name), { recursive: true, force: true });
}

fs.writeFileSync(path.join(siteDir, "index.html"), indexHtml);
fs.writeFileSync(path.join(siteDir, ".nojekyll"), "");

const latestDir = path.join(siteDir, "latest");
fs.rmSync(latestDir, { recursive: true, force: true });
fs.mkdirSync(latestDir, { recursive: true });
fs.writeFileSync(
  path.join(latestDir, "index.html"),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="0; url=${escapeHtml(latestFromLatestDir)}"/>
  <title>Latest Allure report</title>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(latestFromLatestDir)}">the latest Allure report</a>.</p>
</body>
</html>
`,
);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `folder=${folder}\nlatest_href=${latestHref}\nkept=${manifest.reports.map((item) => item.folder).join(",")}\n`,
  );
}

console.log(`Allure gh-pages: added ${folder}; kept ${[...keepFolders].join(", ")}`);
