import { expect, test } from "@playwright/test";

test("homepage shows a database error when content database is not configured", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("文章数据库不可用")).toBeVisible();
  await expect(page.getByText("数据库未配置，文章无法加载。")).toBeVisible();
});
