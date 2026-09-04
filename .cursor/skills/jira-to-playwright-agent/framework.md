# Framework map (Jira-to-Playwright agent)

Canonical detail: [`docs/FRAMEWORK.md`](../../../docs/FRAMEWORK.md)

| Spec | Pages |
|------|-------|
| `tests/ui/welcome.spec.ts` | `WelcomePage`, `PhoneOtpFormComponent` |
| `tests/ui/completeprofile.spec.ts` | `WelcomePage`, `SignupPage` |

```
playwright.config.ts        # ui + api projects, Allure, traces
tests/ui/                   # active Playwright specs
tests/api/                  # reserved
src/page-objects/           # POM
src/fixtures/               # loyalty.fixture.ts
src/config/                 # env + browser.factory
src/data/                   # constants.json
docs/api-enrollment-endpoints-reference.md
```

Prefer extending `tests/ui/` specs and `src/page-objects/`. Identify tests with clear `test()` / `test.step()` titles; optional functional `allure.tags(...)` only. No Cucumber / `features/` / `src/steps/`.
