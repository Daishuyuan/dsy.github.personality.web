import type { Page } from "@playwright/test";

export async function setOwnerToken(page: Page, value: string) {
  await page.addInitScript((value) => {
    window.sessionStorage.setItem("cms_admin_token", value);
  }, value);
}
