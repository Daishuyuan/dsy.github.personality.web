import { beforeEach, describe, expect, it, vi } from "vitest";
import assetsHandler from "../server/apiHandlers/assets";
import { uploadImage } from "../server/assetService";
import { createApiResponse, ownerHeaders, resetCmsMemoryStore } from "./fixtures";

describe("assets API", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_TOKEN", "test-admin-token");
    resetCmsMemoryStore();
  });

  it("lists image assets for the owner", async () => {
    await uploadImage({ fileName: "a.webp", contentType: "image/webp", sizeBytes: 1, dataBase64: "AA==" });
    const res = createApiResponse();

    await assetsHandler({ method: "GET", headers: ownerHeaders(), query: { state: "all" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { total: 1 } });
  });
});
