import { expect, test } from "@playwright/test";

test("admin posts API rejects anonymous requests safely", async ({ request }) => {
  const response = await request.get("/api/cms/posts");
  expect(response.status()).toBe(401);
  const payload = await response.json();
  expect(payload.error.code).toBe("AUTH_REQUIRED");
});
