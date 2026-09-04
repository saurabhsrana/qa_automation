import { test as loyaltyTest } from "./loyalty.fixture";
import { enableEnrollmentAutomationForRun } from "../utils/convexFeatureFlag";

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
    async (_fixtures, use) => {
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
