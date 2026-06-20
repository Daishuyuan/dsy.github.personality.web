import { beforeEach, describe, expect, it } from "vitest";
import { saveArticleDraft, publishArticle, archiveArticle } from "../server/articleService";
import { saveImageAsset, listImageAssets } from "../server/assetRepository";
import { listArticleVersions } from "../server/versionRepository";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("article service", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("creates, publishes, and archives an article", async () => {
    const draft = await saveArticleDraft(sampleArticleDraft());
    expect(draft.status).toBe("draft");

    const published = await publishArticle(draft.articleId, draft.version);
    expect(published.status).toBe("published");

    const archived = await archiveArticle(published.articleId, published.version);
    expect(archived.status).toBe("archived");
  });

  it("creates a version before updating an article", async () => {
    const draft = await saveArticleDraft(sampleArticleDraft());
    await saveArticleDraft({ ...sampleArticleDraft({ title: "Updated" }), articleId: draft.articleId, expectedVersion: draft.version });
    const versions = await listArticleVersions(draft.articleId);
    expect(versions).toHaveLength(1);
    expect(versions[0].snapshot.title).toBe("Test Note");
  });

  it("recalculates image asset usage when markdown changes", async () => {
    await saveImageAsset({
      assetId: "asset_test",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "2026/06/test.webp",
      publicUrl: "/assets/uploads/2026/06/test.webp",
      originalName: "test.webp",
      contentType: "image/webp",
      sizeBytes: 10,
      usedByArticleIds: [],
      createdAt: "2026-06-20T00:00:00.000Z",
      createdBy: "owner"
    });

    const draft = await saveArticleDraft(
      sampleArticleDraft({ markdown: "# Test Note\n\n![demo](/assets/uploads/2026/06/test.webp)" })
    );
    expect((await listImageAssets())[0].usedByArticleIds).toContain(draft.articleId);

    await saveArticleDraft({ ...sampleArticleDraft(), articleId: draft.articleId, expectedVersion: draft.version });
    expect((await listImageAssets())[0].usedByArticleIds).not.toContain(draft.articleId);
  });

  it("keeps only the latest 30 article versions", async () => {
    let article = await saveArticleDraft(sampleArticleDraft());
    for (let index = 0; index < 35; index += 1) {
      article = await saveArticleDraft({
        ...sampleArticleDraft({ title: `Updated ${index}`, markdown: `# Updated ${index}` }),
        articleId: article.articleId,
        expectedVersion: article.version
      });
    }
    expect(await listArticleVersions(article.articleId)).toHaveLength(30);
  });
});
