import { expect, test } from "@playwright/test";

const legacyRoutes = [
  "/2018/03/01/DUBBO的配置与使用手册/",
  "/2018/03/01/算法探究(Javascript)之大杂烩(1)/"
];

for (const route of legacyRoutes) {
  test(`legacy route reports database error without Mongo: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByText("文章数据库不可用")).toBeVisible();
  });
}
