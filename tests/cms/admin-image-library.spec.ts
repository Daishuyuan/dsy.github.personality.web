import { expect, test } from "@playwright/test";

test("image library API is owner-only", async ({ request }) => {
  const response = await request.get("/api/cms/assets?state=all");

  expect(response.status()).toBe(401);
});
