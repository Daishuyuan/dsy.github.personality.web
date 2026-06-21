import { expect, test } from "@playwright/test";

test("operations APIs are owner-only", async ({ request }) => {
  const summary = await request.get("/api/cms/operations");
  const health = await request.post("/api/cms/operations/health", { data: {} });

  expect(summary.status()).toBe(401);
  expect(health.status()).toBe(401);
});
