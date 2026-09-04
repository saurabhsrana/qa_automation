# Contributing

## Branching

```
main (production, protected)
  ↑  release PR only (source must be develop)
develop (integration, protected)
  ↑  feature PR
feature/<short-name>
```

| Branch | Role | Who merges into it |
|--------|------|---------------------|
| `feature/*` | Day-to-day work | You (local / PR into develop) |
| `develop` | Integration | PRs from `feature/*` |
| `main` | Production / release | PRs from **`develop` only** |

Do **not** open a PR from `feature/*` into `main`. CI job **`PR source must be develop`** fails those PRs. Add that check as a required status on `main` in GitHub → Settings → Branches.

Push to `develop` runs **smoke**. Push to `main` (or **Run workflow** on `main`) runs the **full suite** and publishes Allure to GitHub Pages (latest at `/`, last 5 at `/archive.html`).

## CI workflow (smoke vs regression)

Playwright native tags (`{ tag: ['@smoke', '@regression'] }`) drive which tests run. `allure.tags(...)` is for the Allure report only and is **not** used by `--grep`.

| Trigger | E2E selection | Notes |
|---------|---------------|--------|
| Pull request + **`ready-for-e2e`** | `--grep @smoke` | Unlabeled PRs still skip E2E (neutral). Convex enrollment flag + secrets unchanged. |
| Push to **`develop`** | `--grep @smoke` | Automatic after lint. |
| Push to **`main`** / **`master`** | Full suite (no `--grep`) | Release gate — every spec, including untagged tests. |
| Manual **Run workflow** | `test_filter` input | Type `@smoke`, `@regression`, or leave empty for the full suite. |

### Local equivalents

```bash
npx playwright test --project=chromium --grep @smoke
npx playwright test --project=chromium --grep @regression
npx playwright test --project=chromium          # full suite
```

### Tagging new tests

Put Playwright tags on `test.describe` **or** `test()`, not both (Allure copies each `@smoke` / `@regression`). Use `applyAllureBehavior` for epic/feature/story plus suite names only (`welcome`, `completeprofile`) — do not repeat `smoke` / `regression` there.

```typescript
test.describe("My flow", { tag: ["@smoke", "@regression"] }, () => {
  test("clear descriptive title", async ({ ... }) => {
    await applyAllureBehavior({
      epic: "Loyalty",
      feature: "My flow",
      story: "clear descriptive title",
      tags: ["myflow"],
    });
  });
});
```

Use `@smoke` for the cheap PR/develop gate. Add `@regression` (or only `@regression`) for longer coverage that should still run on `main`.
