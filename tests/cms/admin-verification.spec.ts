import { expect, test } from "@playwright/test";

test("verification API is owner-only", async ({ request }) => {
  const response = await request.post("/api/cms/verification", { data: {} });

  expect(response.status()).toBe(401);
});
