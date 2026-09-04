# Loyalty Playwright automation (welcome + complete profile)

Playwright Test for Revance Loyalty. Reporting is **Allure only**. Tests are identified by clear, descriptive `test()` titles and `test.step()` names.

## Suites

| Spec | Tags | Command (default = qa) |
|------|------|-------------------------|
| Welcome / phone OTP | `welcome`, `smoke`, `regression` | `npm run test:welcome` or `npm run test:welcome:uat` |
| Complete profile | `completeprofile`, `smoke`, `regression` | `npm run test:completeprofile` or `npm run test:completeprofile:uat` |
| Both (UI project) | | `npm run test:loyalty` or `npm test` |

Explicit env variants exist for every family: `:qa`, `:uat`, `:dev` (e.g. `npm run test:pw:uat`).

**Environment selection:** Base scripts use `scripts/run-playwright.js` — they default to **qa** when `TEST_ENV` is unset and **preserve** a `TEST_ENV` you set in the shell. Use `:qa` / `:uat` / `:dev` script suffixes when you want the env fixed regardless of shell state.

```powershell
# Shell TEST_ENV is respected (not overwritten by npm script):
$env:TEST_ENV="uat"; npm run test:welcome

# Explicit variant (always uat):
npm run test:welcome:uat
```

API enrollment specs are reserved under `tests/api/` (see `docs/api-enrollment-endpoints-reference.md`).

## Setup

```bash
cp .env.example .env
npm ci
npx playwright install
```

## Allure reporting

```bash
npm test
npm run allure:report
npm run ci:summary
```

PowerShell tip: prefer single `npm run …` scripts (no `&&`). Example: `npm run allure:report` runs generate then open.

- Name each test with a clear, descriptive `test('…')` title; use `test.step('…')` for actions and assertions
- Optional functional tags via `allure.tags(...)` (e.g. `smoke`, `regression`) — no test-case ID tags
- On failure, Allure includes screenshot + downloadable Playwright trace zip
- Allure **Behaviors** and **Suites** views organize results by epic/feature/story and describe/test titles

## Layout

```
tests/ui/      welcome.spec.ts, completeprofile.spec.ts
tests/api/     reserved (README only until contract-verified rewrite)
src/page-objects/  WelcomePage, SignupPage, BasePage, PhoneOtpFormComponent
src/fixtures/  loyalty.fixture.ts, enrollment.fixture.ts (Convex flag for enrollment)
src/config/    environmentResolver, environments/{dev,qa,uat}.config.ts, oceAuth, browser.factory
src/data/      constants.json (static test data)
src/utils/     testData.ts (dynamic helpers), logger.ts
docs/          FRAMEWORK.md, api-enrollment-endpoints-reference.md
scripts/       ci-job-summary.js, allure-clean.js
playwright.config.ts
allurerc.cjs
```

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### What runs when

| Event | Lint & typecheck | Playwright E2E + Allure | GitHub Pages |
|-------|------------------|-------------------------|--------------|
| Push to `main` / `master` | Yes | Yes (full matrix) | Yes (after combine) |
| Pull request (no label) | Yes | **Skipped** (neutral) | No |
| Pull request + `ready-for-e2e` label | Yes | Yes | No (artifact + PR comment only) |
| Manual **Run workflow** | Yes | Yes | Only if run on main |

E2E hits a **shared QA environment**, so PR runs are gated behind the **`ready-for-e2e`** label to avoid colliding on shared test data.

**How to run E2E on a PR:** open the PR → right sidebar **Labels** → add `ready-for-e2e` (create the label once if it doesn’t exist). No need to use the Actions tab. Pushing new commits while the label is still present re-runs E2E automatically. Remove the label to skip E2E on later updates.

### Pipeline steps (when E2E runs)

1. **Lint & typecheck** — ESLint, TypeScript, Prettier
2. **Playwright UI** — chromium / firefox matrix (WebKit excluded — Vercel bot checkpoint; run locally via `npm run test:webkit`)
3. **Reports** — Combine Allure, Job Summary, artifacts (14-day retention)
4. **Pages** — Allure publish on main push only (`always()` so failed tests still deploy the report)

### Configuration

Environment config lives in `src/config/environments/{dev,qa,uat}.config.ts`. Selection is via `getEnvironmentConfig()` (`TEST_ENV`: **dev | qa | uat**; default **qa** when unset). CI sets `TEST_ENV=qa` and uses repository secrets `CONVEX_DEPLOY_KEY_QA` / `CONVEX_DEPLOY_KEY_UAT` for enrollment flag automation.

At the start of each run, the console prints `Running against: QA (https://…)`. If `BASE_URL` in `.env` overrides the env default, a warning is logged.

Optional `.env` overrides: `TEST_ENV`, `BASE_URL`, `QA_TEST_OTP`, `CONVEX_DEPLOY_KEY_QA`, `CONVEX_DEPLOY_KEY_UAT`, `CONVEX_DEPLOYMENT` (see `.env.example`).

**Enrollment tests (`completeprofile.spec.ts`)** temporarily set Convex `FEATURE_AUTOMATION_ENABLED=true` via `npx convex env set` before the spec and restore the original value after (pass or fail). Requires `convexDeployment` in the active env config (or `CONVEX_DEPLOYMENT` override) and local `npx convex login` or a deploy key: `CONVEX_DEPLOY_KEY_QA` when `TEST_ENV=qa`, `CONVEX_DEPLOY_KEY_UAT` when `TEST_ENV=uat`.

**Browser matrix:** Default runs use **chromium + firefox** only. WebKit is excluded (Vercel bot checkpoint). Raw `playwright test` without `--project` also skips WebKit. To run WebKit explicitly: `npm run test:webkit`.

### Manual run

**Actions → CI → Run workflow** (uses `workflow_dispatch`). Optional checkbox: **enable_video** for failure videos.

### Reading results

- **Playwright UI job → Summary** — pass/fail table and failure messages
- **Artifacts** — download `allure-report-combined` / per-browser artifacts; open `index.html`
- **publish-allure job → Summary** — GitHub Pages URL when Pages is configured (main only)
- **Traces** — from the artifact / Allure attachment, run `npx playwright show-trace <file.zip>`

### One-time GitHub Pages setup (Allure live URL)

The combined Allure report is always uploaded as the **`allure-report-combined`** artifact. To also publish a browsable URL on every `main` push:

1. Open **Settings → Pages** on the repository
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Re-run CI (or push a new commit to `main`)

Expected URL: `https://<owner>.github.io/<repo>/` (for example `https://saurabhsrana.github.io/qa_automation/`)

Until Pages is enabled, the **Publish Allure (GitHub Pages)** job shows setup instructions in its Job Summary; the report itself is still available from artifacts.
