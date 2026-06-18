import { expect, test } from "@playwright/test";
import { isAutoAlgorithm, visualAlgorithmSlugs } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("catalog is usable on narrow viewport", async ({ page }) => {
  await page.goto("/visual-algorithms/");
  await expect(page.getByRole("heading", { name: "可视化算法" })).toBeVisible();
  await expect(page.locator(".va-algorithm-link")).toHaveCount(9);
});

for (const slug of visualAlgorithmSlugs) {
  test(`${slug} detail layout is usable on narrow viewport`, async ({ page }) => {
    await page.goto(`/visual-algorithms/${slug}/`);
    await expect(page.getByRole("button", { name: isAutoAlgorithm(slug) ? "重播" : "运行" })).toBeVisible();
    await expect(page.locator(".va-workbench-main")).toBeVisible();
    await expect(page.locator(".va-workbench-controls")).toBeVisible();
    const boxes = await page.locator(".va-workbench-main, .va-workbench-controls").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
      })
    );
    expect(boxes[0].right).toBeLessThanOrEqual(390);
    expect(boxes[1].right).toBeLessThanOrEqual(390);
  });
}
