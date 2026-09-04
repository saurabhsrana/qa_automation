/**
 * Builds a GitHub Pages site that keeps the latest Allure report at / and
 * the last KEEP historical reports at /runs/<run_number>/.
 *
 * Env:
 *   ALLURE_PAGES_SITE  — site root (default: site)
 *   ALLURE_REPORT_DIR  — this run's Allure HTML (default: artifact)
 *   ALLURE_PAGES_KEEP  — how many run folders to keep (default: 5)
 *   GITHUB_RUN_NUMBER, GITHUB_RUN_ID, GITHUB_SHA, GITHUB_EVENT_NAME
 */
const fs = require("node:fs");
const path = require("node:path");

const KEEP = Number(process.env.ALLURE_PAGES_KEEP || 5);
const siteDir = process.env.ALLURE_PAGES_SITE || "site";
const reportDir = process.env.ALLURE_REPORT_DIR || "artifact";
const runNumber = String(process.env.GITHUB_RUN_NUMBER || "0");
const runId = process.env.GITHUB_RUN_ID || "";
const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
const eventName = process.env.GITHUB_EVENT_NAME || "";

if (!fs.existsSync(path.join(reportDir, "index.html"))) {
  throw new Error(`Allure report missing index.html in ${reportDir}`);
}

const runsDir = path.join(siteDir, "runs");
fs.mkdirSync(runsDir, { recursive: true });

const thisRunDir = path.join(runsDir, runNumber);
fs.rmSync(thisRunDir, { recursive: true, force: true });
fs.cpSync(reportDir, thisRunDir, { recursive: true });
fs.writeFileSync(path.join(thisRunDir, ".nojekyll"), "");

const kept = fs
  .readdirSync(runsDir)
  .filter((name) => /^\d+$/.test(name))
  .map(Number)
  .sort((a, b) => b - a);

for (const old of kept.slice(KEEP)) {
  fs.rmSync(path.join(runsDir, String(old)), { recursive: true, force: true });
}

const retained = kept.slice(0, KEEP);

for (const name of fs.readdirSync(siteDir)) {
  if (name === "runs") {
    continue;
  }
  fs.rmSync(path.join(siteDir, name), { recursive: true, force: true });
}
fs.cpSync(reportDir, siteDir, { recursive: true });
fs.writeFileSync(path.join(siteDir, ".nojekyll"), "");

function archivePage(fromRunsFolder) {
  const rows = retained
    .map((num, index) => {
      const label = index === 0 ? "latest" : `#${num}`;
      let href;
      if (fromRunsFolder) {
        href = `./${num}/`;
      } else {
        href = num === Number(runNumber) ? "./" : `./runs/${num}/`;
      }
      const meta =
        num === Number(runNumber)
          ? `${eventName || "run"} · ${sha}${runId ? ` · Actions ${runId}` : ""}`
          : `run ${num}`;
      return `<li><a href="${href}">Allure ${label}</a> <span>(${meta})</span></li>`;
    })
    .join("\n");
  const latestNote = fromRunsFolder
    ? `<p>Or open the <a href="../">site root</a> for the newest report.</p>`
    : `<p>The site root is always the newest report.</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Allure reports (last ${KEEP})</title>
  <style>
    body { font-family: sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
    a { font-weight: 600; }
    span { color: #555; }
  </style>
</head>
<body>
  <h1>Allure reports</h1>
  <p>Keeping the last ${KEEP} CI publishes.</p>
  ${latestNote}
  <ol>
${rows}
  </ol>
</body>
</html>
`;
}

fs.writeFileSync(path.join(siteDir, "archive.html"), archivePage(false));
fs.writeFileSync(path.join(runsDir, "index.html"), archivePage(true));

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `kept=${retained.join(",")}\narchive_path=archive.html\n`,
  );
}

console.log(`Allure Pages site: kept runs ${retained.join(", ")}`);
