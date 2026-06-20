import { expect, test } from "@playwright/test";

test("health API is owner-only", async ({ request }) => {
  const response = await request.get("/api/cms/health");
  expect(response.status()).toBe(401);
});
