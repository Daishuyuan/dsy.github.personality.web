import { expect, test } from "@playwright/test";

test("admin page renders token gate", async ({ page }) => {
  await page.goto("/admin/");
  await expect(page.getByPlaceholder("本地 ADMIN_TOKEN")).toBeVisible();
});
