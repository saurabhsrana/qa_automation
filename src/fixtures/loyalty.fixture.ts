import { test as base } from "@playwright/test";
import { SignupPage } from "../page-objects/SignupPage";
import { WelcomePage } from "../page-objects/WelcomePage";
import { installVercelBypassRoute } from "../utils/vercelProtectionBypass";

export type LoyaltyState = {
  phoneNumber?: string;
};

type LoyaltyFixtures = {
  welcomePage: WelcomePage;
  signupPage: SignupPage;
  loyaltyState: LoyaltyState;
  _vercelProtectionBypass: void;
};

/**
 * Playwright fixtures replacing Cucumber World page objects + shared scenario state.
 */
export const test = base.extend<LoyaltyFixtures>({
  _vercelProtectionBypass: [
    async ({ context }, use) => {
      await installVercelBypassRoute(context);
      await use();
    },
    { auto: true },
  ],

  welcomePage: async ({ page }, use) => {
    await use(new WelcomePage(page));
  },

  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },

  // Playwright requires object-destructuring for fixture deps (empty deps = {}).
  // eslint-disable-next-line no-empty-pattern -- no upstream fixtures needed
  loyaltyState: async ({}, use) => {
    const state: LoyaltyState = {};
    await use(state);
  },
});

export { expect } from "@playwright/test";
