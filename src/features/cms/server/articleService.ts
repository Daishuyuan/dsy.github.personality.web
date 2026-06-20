import { randomUUID } from "node:crypto";
import type { Article, ArticleDraftInput } from "../types.ts";
import { createSlugFromTitle, normalizeLegacyPath, parseArticleDraft, slugSegmentsFromPath } from "../validation.ts";
import { renderMarkdown } from "../../content/markdown.ts";
import { insertArticle, findArticleById, replaceArticle, upsertImportedArticle } from "./articleRepository.ts";
import { updateAssetUsageForArticle } from "./assetRepository.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { createArticleVersion } from "./versionRepository.ts";

export async function saveArticleDraft(input: unknown, actor = "owner"): Promise<Article> {
  const draft = parseArticleDraft(input);
  const existing = draft.articleId ? await findArticleById(draft.articleId) : null;
  const rendered = await renderMarkdown(draft.markdown);
  const now = new Date().toISOString();
  const articleId = draft.articleId ?? createArticleId(draft.title);

  if (existing) {
    if (!draft.expectedVersion || draft.expectedVersion !== existing.version) {
      throw new Error("文章版本已变化，请刷新后重试。");
    }
    const previous = await createArticleVersion({ article: existing, reason: "save", actor });
    const next: Article = {
      ...existing,
      ...toArticleFields(draft, rendered.html, rendered.contentHash),
      articleId,
      version: existing.version + 1,
      lastVersionId: previous.versionId,
      updatedAt: now,
      publishedAt: draft.status === "published" ? existing.publishedAt ?? now : existing.publishedAt,
      archivedAt: draft.status === "archived" ? now : undefined
    };
    await replaceArticle(next, existing.version);
    await updateAssetUsageForArticle(next.articleId, rendered.imageSources);
    await writeAuditEvent({ action: "article.update", actor, articleId: next.articleId, details: { status: next.status } });
    return next;
  }

  const article: Article = {
    ...toArticleFields(draft, rendered.html, rendered.contentHash),
    articleId,
    version: 1,
    sourceKind: draft.sourceKind ?? "owner-created",
    createdAt: now,
    updatedAt: now,
    publishedAt: draft.status === "published" ? now : undefined,
    archivedAt: draft.status === "archived" ? now : undefined
  };
  await insertArticle(article);
  await updateAssetUsageForArticle(article.articleId, rendered.imageSources);
  await writeAuditEvent({ action: "article.create", actor, articleId: article.articleId, details: { status: article.status } });
  return article;
}

export async function publishArticle(articleId: string, expectedVersion: number, actor = "owner"): Promise<Article> {
  const existing = await requireArticle(articleId);
  if (existing.version !== expectedVersion) {
    throw new Error("文章版本已变化，请刷新后重试。");
  }
  const previous = await createArticleVersion({ article: existing, reason: "publish", actor });
  const now = new Date().toISOString();
  const next: Article = {
    ...existing,
    status: "published",
    version: existing.version + 1,
    lastVersionId: previous.versionId,
    updatedAt: now,
    publishedAt: existing.publishedAt ?? now,
    archivedAt: undefined
  };
  await replaceArticle(next, existing.version);
  await writeAuditEvent({ action: "article.publish", actor, articleId, details: { version: next.version } });
  return next;
}

export async function archiveArticle(articleId: string, expectedVersion: number, actor = "owner"): Promise<Article> {
  const existing = await requireArticle(articleId);
  if (existing.version !== expectedVersion) {
    throw new Error("文章版本已变化，请刷新后重试。");
  }
  const previous = await createArticleVersion({ article: existing, reason: "archive", actor });
  const now = new Date().toISOString();
  const next: Article = {
    ...existing,
    status: "archived",
    version: existing.version + 1,
    lastVersionId: previous.versionId,
    updatedAt: now,
    archivedAt: now
  };
  await replaceArticle(next, existing.version);
  await writeAuditEvent({ action: "article.archive", actor, articleId, details: { version: next.version } });
  return next;
}

export async function importArticle(article: Article, actor = "owner"): Promise<Article> {
  const saved = await upsertImportedArticle(article);
  await writeAuditEvent({ action: "import.run", actor, articleId: saved.articleId, details: { path: saved.legacyPath } });
  return saved;
}

async function requireArticle(articleId: string): Promise<Article> {
  const article = await findArticleById(articleId);
  if (!article) {
    throw new Error("文章不存在。");
  }
  return article;
}

function toArticleFields(draft: ArticleDraftInput, renderedHtml: string, contentHash: string) {
  const legacyPath = normalizeLegacyPath(draft.legacyPath);
  return {
    legacyPath,
    slugSegments: slugSegmentsFromPath(legacyPath),
    title: draft.title,
    publishedDate: draft.publishedDate,
    tags: draft.tags,
    toc: draft.toc,
    status: draft.status,
    markdown: draft.markdown,
    renderedHtml,
    contentHash
  };
}

function createArticleId(title: string): string {
  return `post:${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${createSlugFromTitle(title)}-${randomUUID().slice(0, 8)}`;
}
