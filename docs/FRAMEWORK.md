# FRAMEWORK.md — Loyalty Playwright Test (welcome + completeprofile)

## Scope

Two active UI suites (plain Playwright Test — no Cucumber / Gherkin):

| Spec | Pages |
|------|-------|
| `tests/ui/welcome.spec.ts` | `WelcomePage`, `PhoneOtpFormComponent` |
| `tests/ui/completeprofile.spec.ts` | `WelcomePage`, `SignupPage` |

Shared: `BasePage`, `src/fixtures/loyalty.fixture.ts`, `src/config/*`, `src/utils/testData.ts`, `src/utils/logger.ts`.

Reserved: `tests/api/` + `docs/api-enrollment-endpoints-reference.md` for a future **verified** API enrollment rewrite (not populated yet).

## Reporting

End-to-end chain:

`test()` / `test.step()` titles → `expect()` assertions → Allure status / attachments → Job Summary + HTML report

| Piece | Where |
|-------|--------|
| Test identification | Descriptive `test('…')` titles and `test.step('…')` names in `tests/ui/*.spec.ts` |
| Optional grouping tags | `allure.tags(...)` for functional categories (e.g. `smoke`, `regression`) |
| Failure screenshot / video / trace | Playwright `use` + `allure-playwright` |
| Overview metadata (executor / env / categories) | `scripts/allure-prepare-metadata.js` + `allurerc.cjs` |
| Trend history (CI) | `reports/allure-history/history.jsonl` restored via Actions cache |
| CI Job Summary | `npm run ci:summary` |

```bash
npm run test:loyalty
npm run allure:report
```

- `TEST_ENV` → `src/config/environments/{dev|qa|uat}.config.ts` via `getEnvironmentConfig()` (default **qa**; throws on invalid values)
- Optional overrides via `.env` (`BASE_URL` logs a startup warning when it differs from the env default; `QA_TEST_OTP`)
- CI runs **chromium + firefox** only (WebKit excluded — Vercel bot checkpoint on QA). Opt-in locally: `npm run test:webkit` (`INCLUDE_WEBKIT=true`)
- Report UI: Allure 3 **`allure2`** plugin (classic Overview home) with `singleFile: true` — no deep-link away from Overview

## Commands

```bash
npm test
npm run test:welcome
npm run test:completeprofile
npm run test:loyalty
npm run test:pw:api          # no-op until tests/api has specs
npm run allure:report
```

## Contribution / Review Process

1. Branch from `main`, open a PR — do not push framework-breaking changes straight to `main` without review.
2. CI must run Playwright UI (`--project=ui`) and upload Allure artifacts.
3. Reviewers should check:
   - Job Summary / Allure report (pass/fail, attachments on failures)
   - Test titles and steps are clear and match the scenario under test
   - POM reuse under `src/pages/` (no duplicate page objects; no hardcoded waits)
4. Structural migrations (runner swap, deleting suites, changing secrets/CI contracts) require **explicit sign-off** before merge — a green pipeline alone is not enough.
