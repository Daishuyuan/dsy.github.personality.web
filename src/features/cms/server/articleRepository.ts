import type { Article, PaginatedResult } from "../types.ts";
import type { PublicArticle } from "../../content/types.ts";
import { normalizeLegacyPath } from "../validation.ts";
import { ensureCmsIndexes } from "./indexes.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { canUseMemoryRepository, requireCmsDatabase } from "./mongo.ts";

export interface OwnerArticleQuery {
  status?: Article["status"];
  page: number;
  pageSize: number;
  q?: string;
  tag?: string;
}

export async function listOwnerArticles(query: OwnerArticleQuery): Promise<PaginatedResult<Article>> {
  if (!canUseMemoryRepository()) {
    const database = await requireCmsDatabase();
    await ensureCmsIndexes();
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.tag) {
      filter.tags = query.tag;
    }
    if (query.q) {
      filter.title = { $regex: escapeRegex(query.q), $options: "i" };
    }
    const collection = database.collection<Article>("articles");
    const total = await collection.countDocuments(filter);
    const items = await collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .toArray();
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  let items = [...getCmsMemoryStore().articles];
  if (query.status) {
    items = items.filter((article) => article.status === query.status);
  }
  if (query.tag) {
    items = items.filter((article) => article.tags.includes(query.tag ?? ""));
  }
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter((article) => article.title.toLowerCase().includes(needle));
  }
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    total: items.length
  };
}

export async function listPublishedArticles(): Promise<PublicArticle[]> {
  const articles = canUseMemoryRepository()
    ? getCmsMemoryStore()
        .articles.filter((article) => article.status === "published")
        .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    : await (await requireCmsDatabase())
        .collection<Article>("articles")
        .find({ status: "published" })
        .sort({ publishedDate: -1, updatedAt: -1 })
        .toArray();
  return articles.map(toPublicArticle);
}

export async function findArticleById(articleId: string): Promise<Article | null> {
  if (!canUseMemoryRepository()) {
    const database = await requireCmsDatabase();
    await ensureCmsIndexes();
    return database.collection<Article>("articles").findOne({ articleId });
  }
  return getCmsMemoryStore().articles.find((article) => article.articleId === articleId) ?? null;
}

export async function findArticleByLegacyPath(legacyPath: string): Promise<Article | null> {
  const path = normalizeLegacyPath(legacyPath);
  if (!canUseMemoryRepository()) {
    const database = await requireCmsDatabase();
    await ensureCmsIndexes();
    return database.collection<Article>("articles").findOne({ legacyPath: path });
  }
  return getCmsMemoryStore().articles.find((article) => article.legacyPath === path) ?? null;
}

export async function findPublishedByPath(legacyPath: string): Promise<PublicArticle | null> {
  const article = await findArticleByLegacyPath(legacyPath);
  if (!article || article.status !== "published") {
    return null;
  }
  return toPublicArticle(article);
}

export async function insertArticle(article: Article): Promise<Article> {
  await assertUniquePath(article);
  if (!canUseMemoryRepository()) {
    const database = await requireCmsDatabase();
    await ensureCmsIndexes();
    await database.collection<Article>("articles").insertOne(article);
  } else {
    getCmsMemoryStore().articles.push(article);
  }
  return article;
}

export async function replaceArticle(article: Article, expectedVersion?: number): Promise<Article> {
  await assertUniquePath(article);
  if (!canUseMemoryRepository()) {
    const database = await requireCmsDatabase();
    await ensureCmsIndexes();
    const filter: Record<string, unknown> = { articleId: article.articleId };
    if (expectedVersion) {
      filter.version = expectedVersion;
    }
    const result = await database.collection<Article>("articles").replaceOne(filter, article);
    if (result.matchedCount === 0) {
      throw new Error("文章版本已变化，请刷新后重试。");
    }
  } else {
    const store = getCmsMemoryStore();
    const index = store.articles.findIndex((item) => item.articleId === article.articleId);
    if (index < 0) {
      throw new Error("文章不存在。");
    }
    if (expectedVersion && store.articles[index].version !== expectedVersion) {
      throw new Error("文章版本已变化，请刷新后重试。");
    }
    store.articles[index] = article;
  }
  return article;
}

export async function upsertImportedArticle(article: Article): Promise<Article> {
  const existing = await findArticleById(article.articleId);
  if (existing) {
    return replaceArticle({ ...article, version: existing.version + 1, createdAt: existing.createdAt }, existing.version);
  }
  return insertArticle(article);
}

export function toPublicArticle(article: Article): PublicArticle {
  return {
    articleId: article.articleId,
    legacyPath: article.legacyPath,
    slugSegments: article.slugSegments,
    title: article.title,
    publishedDate: article.publishedDate,
    tags: article.tags,
    toc: article.toc,
    renderedHtml: article.renderedHtml,
    excerpt: article.excerpt,
    updatedAt: article.updatedAt
  };
}

async function assertUniquePath(article: Article): Promise<void> {
  const existing = await findArticleByLegacyPath(article.legacyPath);
  if (existing && existing.articleId !== article.articleId) {
    throw new Error("文章路径已经存在。");
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
