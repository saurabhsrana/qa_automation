import { test } from "../../src/fixtures/loyalty.fixture";
import { applyAllureBehavior } from "../../src/utils/allureMeta";
import { welcomeHeading } from "../../src/utils/testData";

/**
 * Converted from the original Cucumber features/welcome.feature.
 * Restores formerly commented heading + Contact Us assertions.
 */
test.describe(
  "Revance Welcome Page",
  { tag: ["@smoke", "@regression"] },
  () => {
    test.beforeEach(async () => {
      await applyAllureBehavior({
        epic: "Loyalty",
        feature: "Revance Welcome Page",
        story: "User visits the welcome page and verifies UI elements",
        tags: ["welcome", "smoke", "regression"],
      });
    });

    test(
      "User visits the welcome page and verifies UI elements",
      { tag: ["@smoke", "@regression"] },
      async ({ welcomePage }) => {
        await test.step("I am on the Revance Welcome page", async () => {
          await welcomePage.goto();
        });

        await test.step(`the main heading should be "${welcomeHeading}"`, async () => {
          await welcomePage.expectHeading(welcomeHeading);
        });

        await test.step("the Contact Us link should be visible", async () => {
          await welcomePage.expectContactUsVisible();
        });
      },
    );
  },
);
