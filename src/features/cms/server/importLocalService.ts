import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { MigrationReport } from "../types.ts";
import { importArticle } from "./articleService.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { canUseMemoryRepository, getCmsDatabase, requireCmsDatabase } from "./mongo.ts";
import { mapLocalMarkdownFile } from "./localArticleMapper.ts";

export async function importLocalArticles(root = process.cwd(), mode: "dry-run" | "apply" = "dry-run"): Promise<MigrationReport> {
  const blogDir = join(root, "src", "content", "blog");
  const files = (await readdir(blogDir)).filter((name) => name.endsWith(".md"));
  const articles = await Promise.all(files.map((name) => mapLocalMarkdownFile(join(blogDir, name))));
  const duplicatePaths = findDuplicates(articles.map((article) => article.legacyPath));
  if (mode === "apply") {
    await requireCmsDatabase();
  }
  if (mode === "apply" && duplicatePaths.length === 0) {
    for (const article of articles) {
      await importArticle(article);
    }
  }
  const report: MigrationReport = {
    reportId: `migration_${Date.now()}`,
    mode,
    localArticleCount: articles.length,
    dynamicArticleCount: mode === "apply" ? articles.length : 0,
    missingArticleIds: [],
    changedArticleIds: [],
    duplicatePaths,
    renderingMarkerMismatches: [],
    passed: duplicatePaths.length === 0,
    createdAt: new Date().toISOString()
  };
  await saveMigrationReport(report);
  return report;
}

export async function saveMigrationReport(report: MigrationReport): Promise<MigrationReport> {
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<MigrationReport>("migration_reports").insertOne(report);
  } else if (canUseMemoryRepository()) {
    getCmsMemoryStore().migrationReports.push(report);
  }
  return report;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return Array.from(duplicates);
}
