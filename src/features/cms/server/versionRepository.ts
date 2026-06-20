import { randomUUID } from "node:crypto";
import type { Article, ArticleVersion, ArticleVersionReason } from "../types.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";

const RETAINED_VERSION_COUNT = 30;

export async function createArticleVersion(input: {
  article: Article;
  reason: ArticleVersionReason;
  actor: string;
  restoredFromVersionId?: string;
}): Promise<ArticleVersion> {
  const version: ArticleVersion = {
    versionId: `ver_${randomUUID()}`,
    articleId: input.article.articleId,
    fromVersion: input.article.version,
    snapshot: input.article,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: input.actor,
    restoredFromVersionId: input.restoredFromVersionId
  };
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<ArticleVersion>("article_versions").insertOne(version);
  } else {
    getCmsMemoryStore().versions.push(version);
  }
  await pruneVersions(version.articleId);
  return version;
}

export async function listArticleVersions(articleId: string): Promise<ArticleVersion[]> {
  const database = await getCmsDatabase();
  if (database) {
    return database
      .collection<ArticleVersion>("article_versions")
      .find({ articleId })
      .sort({ createdAt: -1 })
      .limit(RETAINED_VERSION_COUNT)
      .toArray();
  }
  return getCmsMemoryStore()
    .versions.filter((version) => version.articleId === articleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RETAINED_VERSION_COUNT);
}

export async function findArticleVersion(articleId: string, versionId: string): Promise<ArticleVersion | null> {
  const database = await getCmsDatabase();
  if (database) {
    return database.collection<ArticleVersion>("article_versions").findOne({ articleId, versionId });
  }
  return getCmsMemoryStore().versions.find((version) => version.articleId === articleId && version.versionId === versionId) ?? null;
}

async function pruneVersions(articleId: string): Promise<void> {
  const database = await getCmsDatabase();
  const versions = database
    ? await database
        .collection<ArticleVersion>("article_versions")
        .find({ articleId })
        .sort({ createdAt: -1 })
        .toArray()
    : getCmsMemoryStore()
        .versions.filter((version) => version.articleId === articleId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const stale = versions.slice(RETAINED_VERSION_COUNT);
  if (stale.length === 0) {
    return;
  }
  const staleIds = stale.map((version) => version.versionId);
  if (database) {
    await database.collection<ArticleVersion>("article_versions").deleteMany({ articleId, versionId: { $in: staleIds } });
  } else {
    const store = getCmsMemoryStore();
    store.versions = store.versions.filter((version) => !staleIds.includes(version.versionId));
  }
}
