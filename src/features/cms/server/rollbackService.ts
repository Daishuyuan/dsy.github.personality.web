import type { Article } from "../types.ts";
import { findArticleById, replaceArticle } from "./articleRepository.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { createArticleVersion, findArticleVersion } from "./versionRepository.ts";

export async function rollbackArticle(
  articleId: string,
  versionId: string,
  expectedVersion: number,
  actor = "owner"
): Promise<Article> {
  const current = await findArticleById(articleId);
  if (!current) {
    throw new Error("文章不存在。");
  }
  if (current.version !== expectedVersion) {
    throw new Error("文章版本已变化，请刷新后重试。");
  }
  const target = await findArticleVersion(articleId, versionId);
  if (!target) {
    throw new Error("版本不存在。");
  }
  const previous = await createArticleVersion({
    article: current,
    reason: "rollback",
    actor,
    restoredFromVersionId: versionId
  });
  const now = new Date().toISOString();
  const next: Article = {
    ...target.snapshot,
    version: current.version + 1,
    lastVersionId: previous.versionId,
    updatedAt: now
  };
  await replaceArticle(next, current.version);
  await writeAuditEvent({ action: "article.rollback", actor, articleId, details: { versionId } });
  return next;
}
