import { beforeEach, describe, expect, it } from "vitest";
import { runContentHealthCheck } from "../server/healthReportService";
import { saveImageAsset } from "../server/assetRepository";
import { saveArticleDraft } from "../server/articleService";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("health report service", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("passes when content has no reportable issues", async () => {
    await saveArticleDraft(sampleArticleDraft({ status: "published" }));

    const report = await runContentHealthCheck({ scope: "all", includeDrafts: true, checkImageAvailability: false });

    expect(report.status).toBe("passed");
    expect(report.issueCount).toBe(0);
  });

  it("warns for legacy and unused images", async () => {
    await saveArticleDraft(sampleArticleDraft({ markdown: "![legacy](/assets/blogImg/a.png)" }));
    await saveImageAsset({
      assetId: "asset_unused",
      storageProvider: "memory",
      bucket: "blog-images",
      objectPath: "unused.webp",
      publicUrl: "/assets/uploads/unused.webp",
      originalName: "unused.webp",
      contentType: "image/webp",
      sizeBytes: 1,
      usedByArticleIds: [],
      createdAt: "2026-06-20T00:00:00.000Z",
      createdBy: "owner"
    });

    const report = await runContentHealthCheck({ scope: "all", includeDrafts: true, checkImageAvailability: false });

    expect(report.status).toBe("warning");
    expect(report.issues.map((issue) => issue.category)).toContain("image-reference");
    expect(report.issues.map((issue) => issue.category)).toContain("asset-usage");
  });

  it("fails when rendered content is missing", async () => {
    const article = await saveArticleDraft(sampleArticleDraft());
    article.renderedHtml = "";

    const report = await runContentHealthCheck({ scope: "all", includeDrafts: true, checkImageAvailability: false });

    expect(report.status).toBe("failed");
    expect(report.issues.some((issue) => issue.category === "article-rendering")).toBe(true);
  });
});
