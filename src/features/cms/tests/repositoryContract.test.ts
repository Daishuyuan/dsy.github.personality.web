import { beforeEach, describe, expect, it } from "vitest";
import { createContentExport } from "../server/exportService.ts";
import { importLocalArticles } from "../server/importLocalService.ts";
import { writeAuditEvent } from "../server/auditRepository.ts";
import { saveArticleDraft } from "../server/articleService.ts";
import { findArticleById, listOwnerArticles } from "../server/articleRepository.ts";
import { saveImageAsset, listImageAssets } from "../server/assetRepository.ts";
import { listArticleVersions } from "../server/versionRepository.ts";
import { getCmsMemoryStore } from "../server/memoryStore.ts";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("CMS repository contract", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("persists article, version, asset, audit, export, and migration records", async () => {
    const article = await saveArticleDraft(sampleArticleDraft());
    await saveArticleDraft({
      ...sampleArticleDraft({ title: "Updated Note" }),
      articleId: article.articleId,
      expectedVersion: article.version
    });
    await saveImageAsset({
      assetId: "asset_contract",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "contract.webp",
      publicUrl: "/assets/uploads/contract.webp",
      originalName: "contract.webp",
      contentType: "image/webp",
      sizeBytes: 1,
      usedByArticleIds: [article.articleId],
      createdAt: "2026-06-20T00:00:00.000Z",
      createdBy: "owner"
    });
    await writeAuditEvent({ action: "article.update", actor: "owner", articleId: article.articleId });
    await createContentExport("owner");
    await importLocalArticles(process.cwd(), "dry-run");

    expect(await findArticleById(article.articleId)).not.toBeNull();
    expect((await listOwnerArticles({ page: 1, pageSize: 10 })).total).toBe(1);
    expect(await listArticleVersions(article.articleId)).toHaveLength(1);
    expect(await listImageAssets()).toHaveLength(1);
    expect(getCmsMemoryStore().auditEvents.length).toBeGreaterThan(0);
    expect(getCmsMemoryStore().exports).toHaveLength(1);
    expect(getCmsMemoryStore().migrationReports).toHaveLength(1);
  });
});
