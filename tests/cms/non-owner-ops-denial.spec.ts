import { expect, test } from "@playwright/test";

test("operations data is not exposed to anonymous users", async ({ request }) => {
  const paths = ["/api/cms/operations", "/api/cms/assets?state=all", "/api/cms/audit"];

  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/mongodb|supabase.*service|token|password/i);
  }
});
