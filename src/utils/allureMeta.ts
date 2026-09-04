import * as allure from "allure-js-commons";

export type AllureBehaviorMeta = {
  epic: string;
  feature: string;
  story: string;
  tags: string[];
};

/** Attach Behaviors labels so Allure groups the result even if later hooks fail. */
export async function applyAllureBehavior(
  meta: AllureBehaviorMeta,
): Promise<void> {
  await allure.epic(meta.epic);
  await allure.feature(meta.feature);
  await allure.story(meta.story);
  if (meta.tags.length > 0) {
    await allure.tags(...meta.tags);
  }
}
