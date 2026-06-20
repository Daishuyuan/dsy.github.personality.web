import { describe, expect, it } from "vitest";
import { createAstroApiRoute } from "../server/astroApi.ts";

describe("createAstroApiRoute", () => {
  it("decodes encoded route params before forwarding them to CMS handlers", async () => {
    const route = createAstroApiRoute((req, res) => {
      res.json({ articleId: req.query?.articleId });
    });

    const response = await route({
      request: new Request("http://example.test/api/cms/posts/post%3Atest"),
      params: { articleId: "post%3Atest" }
    } as never);

    await expect(response.json()).resolves.toEqual({ articleId: "post:test" });
  });
});
