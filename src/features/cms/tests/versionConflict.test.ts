import { describe, expect, it } from "vitest";
import { AdminRequestError } from "../admin/adminClient";
import { isVersionConflictError, rebaseDraftOnLatestVersion } from "../admin/versionConflict";
import type { Article } from "../types";

describe("CMS admin version conflicts", () => {
  it("recognizes conflict responses from stale article versions", () => {
    expect(isVersionConflictError(new AdminRequestError("文章版本已变化，请刷新后重试。", 409, "CONFLICT"))).toBe(true);
    expect(isVersionConflictError(new AdminRequestError("请求参数不合法。", 400, "VALIDATION_ERROR"))).toBe(false);
  });

  it("rebases the user's current draft onto the latest server version", () => {
    const latest = sampleArticle({ version: 7, markdown: "# Latest" });
    const draft = {
      articleId: latest.articleId,
      title: "Edited",
      tags: ["算法"],
      toc: false,
      status: "published" as const,
      markdown: "# Edited"
    };

    expect(rebaseDraftOnLatestVersion(draft, latest)).toMatchObject({
      articleId: latest.articleId,
      version: latest.version,
      expectedVersion: latest.version,
      title: "Edited",
      tags: ["算法"],
      toc: false,
      status: "published",
      markdown: "# Edited"
    });
  });
});

function sampleArticle(overrides: Partial<Article> = {}): Article {
  return {
    articleId: "post:test",
    legacyPath: "/2026/06/21/test/",
    slugSegments: ["2026", "06", "21", "test"],
    title: "Test",
    publishedDate: "2026-06-21",
    tags: ["Test"],
    toc: true,
    status: "draft",
    markdown: "# Test",
    renderedHtml: "<h1>Test</h1>",
    contentHash: "sha256:test",
    sourceKind: "owner-created",
    version: 1,
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides
  };
}
