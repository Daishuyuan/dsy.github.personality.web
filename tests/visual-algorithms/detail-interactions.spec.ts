import { expect, test } from "@playwright/test";
import { expectDetailPageReady, expectVisualOutput, visualAlgorithmSlugs } from "./helpers";

for (const slug of visualAlgorithmSlugs) {
  test(`${slug} runs and resets`, async ({ page }) => {
    await expectDetailPageReady(page, slug);
    await page.getByRole("button", { name: "运行" }).click();
    await expect(page.locator(".va-status")).toContainText("已完成");
    await expectVisualOutput(page);

    await page.getByRole("button", { name: "重置" }).click();
    await expect(page.locator(".va-status")).toContainText("已完成");
    await expectVisualOutput(page);

    await page.reload();
    await expect(page.locator(".va-status")).toContainText("已完成");
  });
}

test("invalid text input keeps the page usable", async ({ page }) => {
  await page.goto("/visual-algorithms/ip-address-split/");
  await expect(page.locator(".va-text-result")).toContainText("找到");
  const input = page.locator(".va-workbench-controls input").first();
  await input.fill("abc");
  await page.getByRole("button", { name: "运行" }).click();
  await expect(page.locator(".va-status")).toContainText("输入无效");
  await expect(page.locator(".va-text-result")).toContainText("等待运行");
});
