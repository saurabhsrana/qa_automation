import * as allure from "allure-js-commons";
import { test } from "../../src/fixtures/enrollment.fixture";
import {
  profileDataSets,
  resolveUniquePhone,
  resolveTestOtp,
  uniqueEmailForPhone,
} from "../../src/utils/testData";

/**
 * Converted from the original Cucumber features/completeprofile.feature.
 * Examples row kept as a one-item array for future data-driven extension.
 */
test.describe("Revance complete profile", () => {
  for (const data of profileDataSets) {
    test("User completes sign-up, profile questions, and sees the rewards dashboard", async ({
      welcomePage,
      signupPage,
      loyaltyState,
    }) => {
      await allure.epic("Loyalty");
      await allure.feature("Revance complete profile");
      await allure.story(
        "User completes sign-up, profile questions, and sees the rewards dashboard",
      );
      await allure.tags("completeprofile", "smoke", "regression");

      await test.step("I am on the Revance Welcome page", async () => {
        await welcomePage.goto();
      });

      await test.step(`I enter the phone number "${data.phone}"`, async () => {
        const resolved = resolveUniquePhone(data.phone);
        loyaltyState.phoneNumber = resolved;
        await welcomePage.enterPhoneNumber(resolved);
      });

      await test.step("I click the Verify button", async () => {
        await welcomePage.clickVerify();
      });

      await test.step("I enter the verification code (from env config)", async () => {
        await signupPage.enterVerificationCode(resolveTestOtp());
      });

      await test.step("I confirm my phone number", async () => {
        await signupPage.confirmPhoneNumber();
      });

      await test.step(`I enter my first name "${data.firstName}"`, async () => {
        await signupPage.enterFirstName(data.firstName);
      });

      await test.step(`I enter my last name "${data.lastName}"`, async () => {
        await signupPage.enterLastName(data.lastName);
      });

      await test.step(`I select my date of birth "${data.dateOfBirth}"`, async () => {
        await signupPage.selectDateOfBirth(data.dateOfBirth);
      });

      await test.step(`I enter my email "${data.email}"`, async () => {
        const email = uniqueEmailForPhone(data.email, loyaltyState.phoneNumber);
        await signupPage.enterEmail(email);
      });

      await test.step(`I enter my zip code "${data.zip}"`, async () => {
        await signupPage.enterZipCode(data.zip);
      });

      await test.step(`I enter my referral code "${data.referralCode}"`, async () => {
        await signupPage.enterReferralCode(data.referralCode);
      });

      await test.step("I click Apply on the sign-up form", async () => {
        await signupPage.clickApplyOnSignUpForm();
      });

      await test.step("I accept all required consent checkboxes", async () => {
        await signupPage.acceptAllConsentCheckboxes();
      });

      await test.step("I click the Create account button", async () => {
        await signupPage.clickCreateAccount();
      });

      await test.step("I click Next on the reward claim screen", async () => {
        await signupPage.clickNextRewardClaimScreen();
      });

      await test.step("I click Next on the follow-up screen", async () => {
        await signupPage.clickNextFollowUpScreen();
      });

      await test.step("I check the checkbox of all questions to complete the profile", async () => {
        await signupPage.checkAllProfileQuestionCheckboxes();
      });

      await test.step("I claim the birthday points", async () => {
        await signupPage.claimBirthdayPoints();
      });

      await test.step(`I should see the dashboard with "${data.expectedPoints}" reward points`, async () => {
        await signupPage.expectDashboardPoints(data.expectedPoints);
      });
    });
  }
});
