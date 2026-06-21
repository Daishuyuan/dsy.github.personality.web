import { randomUUID } from "node:crypto";
import type { Article, ContentHealthIssue, ContentHealthReport, ImageAsset } from "../types.ts";
import { extractImageSources } from "../../content/markdown.ts";
import { listOwnerArticles } from "./articleRepository.ts";
import { listImageAssets } from "./assetRepository.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";

export interface HealthRunInput {
  scope: "all" | "published";
  includeDrafts: boolean;
  checkImageAvailability: boolean;
}

const LEGACY_IMAGE_PREFIX = "/assets/blogImg/";

export async function runContentHealthCheck(input: HealthRunInput, actor = "owner"): Promise<ContentHealthReport> {
  const articles = await listArticlesForHealth(input);
  const assets = await listImageAssets();
  const issues = await collectHealthIssues(articles, assets, input);
  const report = toReport(articles, assets, issues, actor);
  await saveHealthReport(report);
  await writeAuditEvent({
    action: "health.run",
    actor,
    details: { status: report.status, issueCount: report.issueCount }
  });
  return report;
}

export async function getLatestHealthReport(): Promise<ContentHealthReport | null> {
  const database = await getCmsDatabase();
  if (database) {
    return database.collection<ContentHealthReport>("health_reports").find({}).sort({ checkedAt: -1 }).limit(1).next();
  }
  return [...getCmsMemoryStore().healthReports].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0] ?? null;
}

async function saveHealthReport(report: ContentHealthReport): Promise<void> {
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<ContentHealthReport>("health_reports").insertOne(report);
    const stale = await database
      .collection<ContentHealthReport>("health_reports")
      .find({})
      .sort({ checkedAt: -1 })
      .skip(20)
      .project({ reportId: 1 })
      .toArray();
    if (stale.length > 0) {
      await database.collection<ContentHealthReport>("health_reports").deleteMany({
        reportId: { $in: stale.map((item) => item.reportId) }
      });
    }
  } else {
    const store = getCmsMemoryStore();
    store.healthReports = [report, ...store.healthReports].slice(0, 20);
  }
}

async function listArticlesForHealth(input: HealthRunInput): Promise<Article[]> {
  const result = await listOwnerArticles({ page: 1, pageSize: 500 });
  return result.items.filter((article) => {
    if (input.scope === "published") {
      return article.status === "published";
    }
    return input.includeDrafts || article.status !== "draft";
  });
}

async function collectHealthIssues(
  articles: Article[],
  assets: ImageAsset[],
  input: HealthRunInput
): Promise<ContentHealthIssue[]> {
  const issues: ContentHealthIssue[] = [];
  const assetByReference = createAssetReferenceMap(assets);
  const pathCounts = countBy(articles.map((article) => article.legacyPath));

  for (const article of articles) {
    if (!article.articleId) {
      issues.push(createIssue("error", "article-identity", "文章缺少稳定标识。", "重新导入或保存文章以生成 articleId。", { articleId: article.articleId }));
    }
    if (!article.legacyPath || pathCounts.get(article.legacyPath)! > 1) {
      issues.push(createIssue("error", "article-route", "文章发布路径重复或为空。", "检查文章路径并保存唯一发布路径。", { articleId: article.articleId }));
    }
    if (!article.renderedHtml?.trim()) {
      issues.push(createIssue("error", "article-rendering", "文章缺少渲染后的正文。", "重新保存文章以生成 renderedHtml。", { articleId: article.articleId }));
    }

    for (const imageSource of extractAllImageSources(article)) {
      const asset = assetByReference.get(imageSource);
      if (imageSource.startsWith(LEGACY_IMAGE_PREFIX)) {
        issues.push(
          createIssue("warning", "image-reference", "图片仍依赖部署内静态目录。", "优先迁移到 Supabase 图片存储。", {
            articleId: article.articleId,
            imageSource
          })
        );
      }
      if (!asset && shouldReportUnknownImage(imageSource)) {
        issues.push(
          createIssue("warning", "image-reference", "图片引用未匹配到已登记素材。", "确认图片是否已迁移，或重新上传后替换引用。", {
            articleId: article.articleId,
            imageSource
          })
        );
      }
      if (input.checkImageAvailability && imageSource.startsWith("http") && !(await isReachableImage(imageSource))) {
        issues.push(
          createIssue("error", "storage", "图片无法访问。", "检查图片链接或重新上传图片。", {
            articleId: article.articleId,
            assetId: asset?.assetId,
            imageSource
          })
        );
      }
    }
  }

  for (const asset of assets) {
    if (asset.usedByArticleIds.length === 0) {
      issues.push(
        createIssue("info", "asset-usage", "图片当前未被文章引用。", "如确认不再需要，可在后续显式清理功能中处理。", {
          assetId: asset.assetId,
          imageSource: asset.publicUrl
        })
      );
    }
  }

  return issues;
}

function toReport(
  articles: Article[],
  assets: ImageAsset[],
  issues: ContentHealthIssue[],
  actor: string
): ContentHealthReport {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const status = errorCount > 0 ? "failed" : warningCount > 0 ? "warning" : "passed";
  return {
    reportId: `health_${randomUUID()}`,
    status,
    checkedAt: new Date().toISOString(),
    checkedBy: actor,
    articleCount: articles.length,
    publishedCount: articles.filter((article) => article.status === "published").length,
    draftCount: articles.filter((article) => article.status === "draft").length,
    archivedCount: articles.filter((article) => article.status === "archived").length,
    assetCount: assets.length,
    issueCount: issues.length,
    issues: issues.slice(0, 100),
    summary: summarize(status, errorCount, warningCount)
  };
}

function summarize(status: ContentHealthReport["status"], errorCount: number, warningCount: number): string {
  if (status === "passed") {
    return "内容和图片检查通过。";
  }
  if (status === "failed") {
    return `${errorCount} 个错误需要处理。`;
  }
  return `${warningCount} 个警告需要关注。`;
}

function extractAllImageSources(article: Article): string[] {
  const htmlSources = Array.from(article.renderedHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((match) => match[1].trim());
  return Array.from(new Set([...extractImageSources(article.markdown), ...htmlSources]));
}

function createAssetReferenceMap(assets: ImageAsset[]): Map<string, ImageAsset> {
  const references = new Map<string, ImageAsset>();
  for (const asset of assets) {
    references.set(asset.publicUrl, asset);
    references.set(asset.objectPath, asset);
    references.set(`/${asset.objectPath.replace(/^\/+/, "")}`, asset);
  }
  return references;
}

function shouldReportUnknownImage(imageSource: string): boolean {
  return imageSource.startsWith("/") || imageSource.includes("supabase") || imageSource.includes("blog-images");
}

async function isReachableImage(imageSource: string): Promise<boolean> {
  try {
    const response = await fetch(imageSource, { method: "HEAD" });
    return response.ok && (response.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function createIssue(
  severity: ContentHealthIssue["severity"],
  category: ContentHealthIssue["category"],
  message: string,
  recommendedAction: string,
  refs: Pick<ContentHealthIssue, "articleId" | "assetId" | "imageSource"> = {}
): ContentHealthIssue {
  return {
    issueId: `issue_${randomUUID()}`,
    severity,
    category,
    ...refs,
    message,
    recommendedAction
  };
}
