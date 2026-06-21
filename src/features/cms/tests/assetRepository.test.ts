import { beforeEach, describe, expect, it } from "vitest";
import { listImageLibraryItems, saveImageAsset } from "../server/assetRepository";
import { saveArticleDraft } from "../server/articleService";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("asset repository image library shaping", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("enriches assets with article usage and cleanup candidates", async () => {
    const article = await saveArticleDraft(sampleArticleDraft({ markdown: "![a](/assets/uploads/a.webp)" }));
    await saveImageAsset({
      assetId: "asset_a",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "a.webp",
      publicUrl: "/assets/uploads/a.webp",
      originalName: "a.webp",
      contentType: "image/webp",
      sizeBytes: 10,
      usedByArticleIds: [article.articleId],
      createdAt: "2026-06-20T00:00:00.000Z",
      createdBy: "owner"
    });
    await saveImageAsset({
      assetId: "asset_b",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "b.webp",
      publicUrl: "/assets/uploads/b.webp",
      originalName: "b.webp",
      contentType: "image/webp",
      sizeBytes: 10,
      usedByArticleIds: [],
      createdAt: "2026-06-21T00:00:00.000Z",
      createdBy: "owner"
    });

    const result = await listImageLibraryItems({ state: "all", page: 1, pageSize: 10 }, [article]);

    expect(result.total).toBe(2);
    expect(result.items.find((item) => item.assetId === "asset_a")?.usedByArticles[0].title).toBe(article.title);
    expect(result.items.find((item) => item.assetId === "asset_b")?.cleanupCandidate).toBe(true);
  });
});
