import { applyAllureBehavior } from "../utils/allureMeta";
import { enableEnrollmentAutomationForRun } from "../utils/convexFeatureFlag";
import { test as loyaltyTest } from "./loyalty.fixture";

type EnrollmentFixtures = {
  /** Auto: enables FEATURE_AUTOMATION_ENABLED before enrollment tests; restores after. */
  _enrollmentAutomationFlag: void;
};

/**
 * Extends loyalty fixtures with Convex FEATURE_AUTOMATION_ENABLED lifecycle.
 * Use only in enrollment / complete-profile specs — welcome and other suites
 * should keep importing loyalty.fixture.ts directly.
 */
export const test = loyaltyTest.extend<EnrollmentFixtures>({
  _enrollmentAutomationFlag: [
    // eslint-disable-next-line no-empty-pattern -- Convex toggle has no upstream fixture deps
    async ({}, use, testInfo) => {
      // Labels must be set here: a Convex failure aborts before the spec body,
      // which would otherwise leave the result ungrouped in Allure Behaviors.
      await applyAllureBehavior({
        epic: "Loyalty",
        feature: "Revance complete profile",
        story: testInfo.title,
        tags: ["completeprofile", "smoke", "regression"],
      });
      const session = await enableEnrollmentAutomationForRun();
      try {
        await use(undefined);
      } finally {
        await session.restore();
      }
    },
    { auto: true, scope: "test" },
  ],
});

export { expect } from "@playwright/test";
