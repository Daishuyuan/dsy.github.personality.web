import { expect, test } from "@playwright/test";

test("catalog excludes unapproved legacy experiments and filenames", async ({ page }) => {
  await page.goto("/visual-algorithms/");
  const body = page.locator("body");
  for (const excluded of [
    "Test_WASM",
    "pipeline",
    "BlockTerrain",
    "magicNum",
    "memoryManager",
    "CuteBox(ME0001).html"
  ]) {
    await expect(body).not.toContainText(excluded);
  }
  await expect(page.locator(".va-algorithm-link")).toHaveCount(10);
});
