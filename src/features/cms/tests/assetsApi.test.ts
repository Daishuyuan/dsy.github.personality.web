import { beforeEach, describe, expect, it, vi } from "vitest";
import assetsHandler from "../server/apiHandlers/assets";
import { uploadImage } from "../server/assetService";
import { saveArticleDraft } from "../server/articleService";
import { saveImageAsset } from "../server/assetRepository";
import { createApiResponse, ownerHeaders, resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

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

  it("deletes unused image assets for the owner", async () => {
    const asset = await uploadImage({ fileName: "unused.webp", contentType: "image/webp", sizeBytes: 1, dataBase64: "AA==" });
    const res = createApiResponse();

    await assetsHandler({ method: "DELETE", headers: ownerHeaders(), query: { assetId: asset.assetId } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { assetId: asset.assetId, deleted: true } });

    const listRes = createApiResponse();
    await assetsHandler({ method: "GET", headers: ownerHeaders(), query: { state: "all" } }, listRes);
    expect(listRes.body).toMatchObject({ success: true, data: { total: 0 } });
  });

  it("rejects deletion for images still used by articles", async () => {
    const asset = await uploadImage({
      fileName: "used.webp",
      contentType: "image/webp",
      sizeBytes: 1,
      dataBase64: "AA=="
    });
    await saveArticleDraft(sampleArticleDraft({ markdown: `# Test\n\n![used](${asset.publicUrl})` }));
    const res = createApiResponse();

    await assetsHandler({ method: "DELETE", headers: ownerHeaders(), query: { assetId: asset.assetId } }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ success: false, error: { code: "CONFLICT" } });
  });

  it("rejects deletion when current article content references stale asset metadata", async () => {
    await saveArticleDraft(sampleArticleDraft({ markdown: "# Test\n\n![stale](/assets/uploads/stale.webp)" }));
    await saveImageAsset({
      assetId: "asset_stale",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "uploads/stale.webp",
      publicUrl: "/assets/uploads/stale.webp",
      originalName: "stale.webp",
      contentType: "image/webp",
      sizeBytes: 1,
      usedByArticleIds: [],
      createdAt: new Date().toISOString(),
      createdBy: "owner"
    });
    const res = createApiResponse();

    await assetsHandler({ method: "DELETE", headers: ownerHeaders(), query: { assetId: "asset_stale" } }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ success: false, error: { code: "CONFLICT" } });
  });
});
