import type { ActivityRecord, Article, AuditEvent, OperationsSummary } from "../types.ts";
import { listOwnerArticles } from "./articleRepository.ts";
import { listImageAssets } from "./assetRepository.ts";
import { listAuditEvents, type AuditListQuery } from "./auditRepository.ts";
import { getLatestHealthReport } from "./healthReportService.ts";

export async function getOperationsSummary(includeIssues = false): Promise<OperationsSummary> {
  const [articles, assets, auditEvents, latestHealth] = await Promise.all([
    listAllOwnerArticles(),
    listImageAssets(),
    listAuditEvents({ page: 1, pageSize: 100 }),
    getLatestHealthReport()
  ]);
  const duplicatePathCount = countDuplicatePaths(articles);
  const recentFailureCount = auditEvents.items.filter((event) => activityResult(event) === "failure").length;
  return {
    content: {
      articleCount: articles.length,
      publishedCount: articles.filter((article) => article.status === "published").length,
      draftCount: articles.filter((article) => article.status === "draft").length,
      archivedCount: articles.filter((article) => article.status === "archived").length,
      duplicatePathCount,
      missingRenderedCount: articles.filter((article) => !article.renderedHtml?.trim()).length
    },
    assets: {
      assetCount: assets.length,
      usedCount: assets.filter((asset) => asset.usedByArticleIds.length > 0).length,
      unusedCount: assets.filter((asset) => asset.usedByArticleIds.length === 0).length,
      unavailableCount: assets.filter((asset) => !asset.publicUrl).length
    },
    activity: {
      latestEventAt: auditEvents.items[0]?.createdAt,
      recentFailureCount
    },
    latestHealth: latestHealth
      ? {
          status: latestHealth.status,
          checkedAt: latestHealth.checkedAt,
          issueCount: latestHealth.issueCount,
          ...(includeIssues ? { issues: latestHealth.issues.slice(0, 12) } : {})
        }
      : undefined
  };
}

export async function listActivityRecords(query: AuditListQuery) {
  const events = await listAuditEvents(query);
  return {
    ...events,
    items: events.items.map(toActivityRecord)
  };
}

export function toActivityRecord(event: AuditEvent): ActivityRecord {
  return {
    eventId: event.eventId,
    action: event.action,
    actor: event.actor,
    articleId: event.articleId,
    assetId: event.assetId,
    result: activityResult(event),
    summary: activitySummary(event),
    createdAt: event.createdAt
  };
}

async function listAllOwnerArticles(): Promise<Article[]> {
  const firstPage = await listOwnerArticles({ page: 1, pageSize: 500 });
  return firstPage.items;
}

function countDuplicatePaths(articles: Article[]): number {
  const counts = new Map<string, number>();
  for (const article of articles) {
    counts.set(article.legacyPath, (counts.get(article.legacyPath) ?? 0) + 1);
  }
  return Array.from(counts.values()).filter((count) => count > 1).length;
}

function activityResult(event: AuditEvent): ActivityRecord["result"] {
  if (event.action.endsWith(".failure") || event.action === "auth.failure" || event.action === "storage.failure") {
    return "failure";
  }
  const result = event.details?.result;
  if (result === "failure" || result === "success") {
    return result;
  }
  return "success";
}

function activitySummary(event: AuditEvent): string {
  const message = event.details?.message;
  if (typeof message === "string" && message.trim()) {
    return message.slice(0, 160);
  }
  switch (event.action) {
    case "article.create":
      return "创建文章";
    case "article.update":
      return "保存文章";
    case "article.publish":
      return "发布文章";
    case "article.archive":
      return "归档文章";
    case "article.rollback":
      return "恢复版本";
    case "asset.upload":
      return "上传图片";
    case "asset.delete":
      return "删除图片";
    case "import.run":
      return "导入文章";
    case "export.run":
      return "导出内容";
    case "health.run":
      return "运行健康检查";
    case "verification.run":
      return "运行发布验证";
    case "auth.failure":
      return "权限验证失败";
    case "storage.failure":
      return "图片存储失败";
    default:
      return "后台操作";
  }
}
