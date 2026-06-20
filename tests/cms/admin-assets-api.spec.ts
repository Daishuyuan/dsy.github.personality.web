import { expect, test } from "@playwright/test";

test("assets API rejects anonymous upload", async ({ request }) => {
  const response = await request.post("/api/cms/assets", {
    data: { fileName: "a.webp", contentType: "image/webp", sizeBytes: 1, dataBase64: "AA==" }
  });
  expect(response.status()).toBe(401);
});
