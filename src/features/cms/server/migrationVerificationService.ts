import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { MigrationReport } from "../types.ts";
import { findArticleById } from "./articleRepository.ts";
import { mapLocalMarkdownFile } from "./localArticleMapper.ts";
import { saveMigrationReport } from "./importLocalService.ts";

export async function verifyMigration(root = process.cwd()): Promise<MigrationReport> {
  const blogDir = join(root, "src", "content", "blog");
  const files = (await readdir(blogDir)).filter((name) => name.endsWith(".md"));
  const localArticles = await Promise.all(files.map((name) => mapLocalMarkdownFile(join(blogDir, name))));
  const missingArticleIds: string[] = [];
  const changedArticleIds: string[] = [];
  const renderingMarkerMismatches: Array<Record<string, unknown>> = [];

  for (const local of localArticles) {
    const dynamic = await findArticleById(local.articleId);
    if (!dynamic) {
      missingArticleIds.push(local.articleId);
      continue;
    }
    if (dynamic.legacyPath !== local.legacyPath) {
      changedArticleIds.push(local.articleId);
    }
    if (dynamic.title !== local.title || dynamic.tags.join("|") !== local.tags.join("|")) {
      renderingMarkerMismatches.push({ articleId: local.articleId, field: "metadata" });
    }
  }

  const report: MigrationReport = {
    reportId: `migration_verify_${Date.now()}`,
    mode: "verify",
    localArticleCount: localArticles.length,
    dynamicArticleCount: localArticles.length - missingArticleIds.length,
    missingArticleIds,
    changedArticleIds,
    duplicatePaths: [],
    renderingMarkerMismatches,
    passed: missingArticleIds.length === 0 && changedArticleIds.length === 0 && renderingMarkerMismatches.length === 0,
    createdAt: new Date().toISOString()
  };
  await saveMigrationReport(report);
  return report;
}
