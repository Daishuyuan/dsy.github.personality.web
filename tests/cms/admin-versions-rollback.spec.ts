import { expect, test } from "@playwright/test";

test("versions API rejects anonymous requests", async ({ request }) => {
  const response = await request.get("/api/cms/posts/post:test/versions");
  expect(response.status()).toBe(401);
});
