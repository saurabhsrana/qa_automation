/**
 * Writes a GitHub Actions Job Summary with pass/fail, failure details,
 * and links to artifacts / Allure on GitHub Pages.
 *
 * Prefers Allure result JSON (Playwright). Falls back to cucumber.json if present.
 *
 * Env:
 *   BROWSER — browser label (optional)
 *   GITHUB_REPOSITORY, GITHUB_RUN_ID — set by Actions
 *   GITHUB_STEP_SUMMARY — set automatically by Actions
 */
const fs = require("node:fs");
const path = require("node:path");

const cucumberJsonPath = path.resolve("reports/cucumber.json");
const allureResultsDir = path.resolve("reports/allure-results");
const screenshotsDir = path.resolve("reports/screenshots");
const tracesDir = path.resolve("reports/traces");
const allureReportDir = path.resolve("reports/allure-report");

function truncate(text, max = 600) {
  const s = String(text || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function statusEmoji(status) {
  if (status === "passed") return "pass";
  if (status === "failed" || status === "broken") return "fail";
  if (status === "skipped" || status === "pending") return "skip";
  return status || "unknown";
}

function listPngFiles(dir, limit = 5) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .slice(0, limit);
}

function listZipFiles(dir, limit = 5) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".zip"))
    .slice(0, limit);
}

function embedScreenshot(fileName) {
  const filePath = path.join(screenshotsDir, fileName);
  if (!fs.existsSync(filePath)) return "";
  const base64 = fs.readFileSync(filePath).toString("base64");
  return [
    `<details><summary>${fileName}</summary>`,
    `<img src="data:image/png;base64,${base64}" alt="${fileName}" width="900"/>`,
    "</details>",
    "",
  ].join("\n");
}

function artifactLinks() {
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!repo || !runId) return [];

  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  const artifactName = "playwright-ui-artifacts";
  return [
    "## Reports & artifacts",
    "",
    `- [Download \`${artifactName}\` (Allure HTML, traces, screenshots)](${runUrl}#artifacts)`,
    "- Open `reports/allure-report/index.html` from the zip for the full Allure UI (pass/fail, attachments, trace zips).",
    "- Playwright traces: extract Allure `*-attachment.zip` / `test-results/**/trace.zip` and run `npx playwright show-trace <file.zip>`.",
    "",
    "After the **publish-allure** job completes, the latest Allure report is also published to **GitHub Pages** (see that job Summary for the URL).",
    "",
  ];
}

function appendCommonTail(lines) {
  const screenshots = listPngFiles(screenshotsDir);
  if (screenshots.length > 0) {
    lines.push("## Failure screenshots", "");
    for (const shot of screenshots) {
      lines.push(embedScreenshot(shot));
    }
  }

  const traces = listZipFiles(tracesDir);
  if (traces.length > 0) {
    lines.push("## Playwright traces (in artifact zip)", "");
    for (const trace of traces) {
      lines.push(
        `- \`reports/traces/${trace}\` — open locally with \`npx playwright show-trace\``,
      );
    }
    lines.push("");
  }

  if (fs.existsSync(path.join(allureReportDir, "index.html"))) {
    lines.push(
      "## Allure HTML report",
      "",
      "Included in the job artifact at `reports/allure-report/index.html` (single-file bundle — open offline after download).",
      "",
    );
  }

  lines.push(...artifactLinks());
  lines.push(
    "Tests are identified by descriptive titles and step names in the Allure report (Behaviors / Suites views).",
  );
}

function buildFromAllure(results) {
  const lines = ["## Playwright UI results", ""];
  const browser = process.env.BROWSER;
  if (browser) {
    lines.push(`**Browser:** \`${browser}\``, "");
  }
  lines.push("| Status | Test |", "| --- | --- |");

  let passed = 0;
  let failed = 0;
  let other = 0;
  const failureDetails = [];

  for (const r of results) {
    const status = r.status || "unknown";
    if (status === "passed") passed += 1;
    else if (status === "failed" || status === "broken") failed += 1;
    else other += 1;

    lines.push(
      `| ${statusEmoji(status)} | ${r.name || r.fullName || "unnamed"} |`,
    );

    if (status === "failed" || status === "broken") {
      failureDetails.push({
        name: r.name || r.fullName || "unnamed",
        error: r.statusDetails?.message || r.statusDetails?.trace || "No error message",
      });
    }
  }

  lines.push("", `**Totals:** ${passed} passed, ${failed} failed, ${other} other`, "");

  if (failureDetails.length > 0) {
    lines.push("## Failure details", "");
    for (const f of failureDetails) {
      lines.push(`### ${f.name}`, "", "```", truncate(f.error), "```", "");
    }
  }

  appendCommonTail(lines);
  return lines.join("\n");
}

function scenarioStatus(elements) {
  const steps = (elements.steps || []).filter((s) => s.result);
  if (steps.some((s) => s.result.status === "failed")) return "failed";
  if (
    steps.every(
      (s) => s.result.status === "passed" || s.result.status === "skipped",
    )
  ) {
    if (steps.some((s) => s.result.status === "passed")) return "passed";
  }
  if (
    steps.every(
      (s) => s.result.status === "skipped" || s.result.status === "pending",
    )
  ) {
    return "skipped";
  }
  return steps[steps.length - 1]?.result?.status || "unknown";
}

function failedSteps(el) {
  return (el.steps || [])
    .filter((s) => s.result?.status === "failed")
    .map((s) => ({
      name: s.name || "unknown step",
      error: String(
        s.result?.error_message || s.result?.message || "No error message",
      ).trim(),
    }));
}

function buildFromCucumber(features) {
  const lines = ["## Loyalty Cucumber results", ""];
  const browser = process.env.BROWSER;
  if (browser) {
    lines.push(`**Browser:** \`${browser}\``, "");
  }
  lines.push("| Status | Scenario |", "| --- | --- |");

  let passed = 0;
  let failed = 0;
  let other = 0;
  const failureDetails = [];

  for (const feature of features) {
    for (const el of feature.elements || []) {
      if (el.type && el.type !== "scenario" && el.type !== "scenario_outline")
        continue;
      const status = scenarioStatus(el);
      if (status === "passed") passed += 1;
      else if (status === "failed") failed += 1;
      else other += 1;

      lines.push(
        `| ${statusEmoji(status)} | ${el.name || feature.name || "unnamed"} |`,
      );

      if (status === "failed") {
        for (const step of failedSteps(el)) {
          failureDetails.push({
            scenario: el.name || feature.name || "unnamed",
            step: step.name,
            error: step.error,
          });
        }
      }
    }
  }

  lines.push("", `**Totals:** ${passed} passed, ${failed} failed, ${other} other`, "");

  if (failureDetails.length > 0) {
    lines.push("## Failure details", "");
    for (const f of failureDetails) {
      lines.push(
        `### ${f.scenario}`,
        "",
        `**Failed step:** \`${f.step}\``,
        "",
        "```",
        truncate(f.error),
        "```",
        "",
      );
    }
  }

  appendCommonTail(lines);
  return lines.join("\n");
}

function loadAllureResults() {
  if (!fs.existsSync(allureResultsDir)) return [];
  return fs
    .readdirSync(allureResultsDir)
    .filter((f) => f.endsWith("-result.json"))
    .map((f) =>
      JSON.parse(fs.readFileSync(path.join(allureResultsDir, f), "utf8")),
    );
}

function main() {
  const allureResults = loadAllureResults();
  let md;

  if (allureResults.length > 0) {
    md = buildFromAllure(allureResults);
  } else if (fs.existsSync(cucumberJsonPath)) {
    const features = JSON.parse(fs.readFileSync(cucumberJsonPath, "utf8"));
    md = buildFromCucumber(Array.isArray(features) ? features : []);
  } else {
    const msg =
      "No Allure results or cucumber.json — skip detailed job summary.";
    console.warn(msg);
    md = `## Test results\n\n${msg}\n`;
  }

  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
  }
}

main();
