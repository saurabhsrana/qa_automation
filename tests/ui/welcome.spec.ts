import * as allure from "allure-js-commons";
import { test } from "../../src/fixtures/loyalty.fixture";
import { welcomeHeading } from "../../src/utils/testData";

/**
 * Converted from the original Cucumber features/welcome.feature.
 * Restores formerly commented heading + Contact Us assertions.
 */
test.describe("Revance Welcome Page", () => {
  test("User visits the welcome page and verifies UI elements", async ({
    welcomePage,
  }) => {
    await allure.epic("Loyalty");
    await allure.feature("Revance Welcome Page");
    await allure.story("User visits the welcome page and verifies UI elements");
    await allure.tags("welcome", "smoke", "regression");

    await test.step("I am on the Revance Welcome page", async () => {
      await welcomePage.goto();
    });

    await test.step(`the main heading should be "${welcomeHeading}"`, async () => {
      await welcomePage.expectHeading(welcomeHeading);
    });

    await test.step("the Contact Us link should be visible", async () => {
      await welcomePage.expectContactUsVisible();
    });
  });
});
