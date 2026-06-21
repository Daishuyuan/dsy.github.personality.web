import { expect, test } from "@playwright/test";

test("activity API is owner-only", async ({ request }) => {
  const response = await request.get("/api/cms/audit");

  expect(response.status()).toBe(401);
});
