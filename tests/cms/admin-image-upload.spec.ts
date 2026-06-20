import { expect, test } from "@playwright/test";

test("admin page includes upload action after token entry", async ({ page }) => {
  await page.goto("/admin/");
  await page.getByPlaceholder("本地 ADMIN_TOKEN").fill("test-admin-token");
  await page.getByRole("button", { name: "进入" }).click();
  await expect(page.getByText("新文章")).toBeVisible();
});
