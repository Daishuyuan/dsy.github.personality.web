import { expect, test } from "@playwright/test";

test("legacy article page does not use markdown fallback when database is unavailable", async ({ page }) => {
  await page.goto("/2018/03/01/算法探究(Javascript)之大杂烩(1)/");
  await expect(page.getByText("文章数据库不可用")).toBeVisible();
  await expect(page.getByText("评论与点赞")).toHaveCount(0);
});
