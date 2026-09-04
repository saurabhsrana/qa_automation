import * as allure from "allure-js-commons";

export type AllureBehaviorMeta = {
  epic: string;
  feature: string;
  story: string;
  tags: string[];
};

/**
 * Playwright `{ tag: ['@smoke'] }` is already copied into Allure by
 * allure-playwright. Re-adding those names here duplicates the Tags list.
 */
const ALLURE_TAGS_OWNED_BY_PLAYWRIGHT = new Set(["smoke", "regression"]);

function uniqueAllureOnlyTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of tags) {
    const tag = raw.replace(/^@/, "").trim();
    if (!tag || seen.has(tag) || ALLURE_TAGS_OWNED_BY_PLAYWRIGHT.has(tag)) {
      continue;
    }
    seen.add(tag);
    unique.push(tag);
  }
  return unique;
}

/** Attach Behaviors labels so Allure groups the result even if later hooks fail. */
export async function applyAllureBehavior(
  meta: AllureBehaviorMeta,
): Promise<void> {
  await allure.epic(meta.epic);
  await allure.feature(meta.feature);
  await allure.story(meta.story);
  const tags = uniqueAllureOnlyTags(meta.tags);
  if (tags.length > 0) {
    await allure.tags(...tags);
  }
}
