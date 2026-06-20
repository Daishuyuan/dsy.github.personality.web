import { expect, test } from "@playwright/test";

test("admin page renders token gate", async ({ page }) => {
  await page.goto("/admin/");
  await expect(page.getByPlaceholder("ADMIN_TOKEN")).toBeVisible();
});
