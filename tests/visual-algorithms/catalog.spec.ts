import { expect, test } from "@playwright/test";
import { visualAlgorithmSlugs } from "./helpers";

test("catalog lists the approved visual algorithms", async ({ page }) => {
  await page.goto("/visual-algorithms/");
  await expect(page.getByRole("heading", { name: "可视化算法" })).toBeVisible();

  for (const category of ["强化学习", "图形与物理", "数据结构与搜索", "字符串与枚举"]) {
    await expect(page.getByRole("heading", { name: category })).toBeVisible();
  }

  for (const slug of visualAlgorithmSlugs) {
    await expect(page.locator(`a[href="/visual-algorithms/${slug}/"]`)).toHaveCount(1);
  }

  await expect(page.locator("a[href$='.html']")).toHaveCount(0);
});
