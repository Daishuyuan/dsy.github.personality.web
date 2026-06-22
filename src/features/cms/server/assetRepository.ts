import type { Article, ImageAsset, ImageLibraryItem, PaginatedResult } from "../types.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";

export async function saveImageAsset(asset: ImageAsset): Promise<ImageAsset> {
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<ImageAsset>("image_assets").updateOne({ assetId: asset.assetId }, { $set: asset }, { upsert: true });
  } else {
    const store = getCmsMemoryStore();
    const index = store.assets.findIndex((item) => item.assetId === asset.assetId);
    if (index >= 0) {
      store.assets[index] = asset;
    } else {
      store.assets.push(asset);
    }
  }
  return asset;
}

export async function listImageAssets(): Promise<ImageAsset[]> {
  const database = await getCmsDatabase();
  if (database) {
    return database.collection<ImageAsset>("image_assets").find({}).sort({ createdAt: -1 }).toArray();
  }
  return [...getCmsMemoryStore().assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getImageAssetById(assetId: string): Promise<ImageAsset | null> {
  const database = await getCmsDatabase();
  if (database) {
    return database.collection<ImageAsset>("image_assets").findOne({ assetId });
  }
  return getCmsMemoryStore().assets.find((asset) => asset.assetId === assetId) ?? null;
}

export async function deleteImageAssetRecord(assetId: string): Promise<boolean> {
  const database = await getCmsDatabase();
  if (database) {
    const result = await database.collection<ImageAsset>("image_assets").deleteOne({ assetId });
    return result.deletedCount === 1;
  }
  const store = getCmsMemoryStore();
  const index = store.assets.findIndex((asset) => asset.assetId === assetId);
  if (index < 0) {
    return false;
  }
  store.assets.splice(index, 1);
  return true;
}

export interface AssetListQuery {
  state: "all" | "used" | "unused" | "unavailable" | "recent";
  q?: string;
  page: number;
  pageSize: number;
}

export async function listImageLibraryItems(query: AssetListQuery, articles: Article[]): Promise<PaginatedResult<ImageLibraryItem>> {
  const articleMap = new Map(articles.map((article) => [article.articleId, article]));
  let items = (await listImageAssets()).map((asset) => toImageLibraryItem(asset, articleMap));
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(
      (item) => item.originalName.toLowerCase().includes(needle) || item.publicUrl.toLowerCase().includes(needle)
    );
  }
  if (query.state !== "all") {
    items = items.filter((item) => {
      switch (query.state) {
        case "used":
          return item.usageCount > 0;
        case "unused":
          return item.usageCount === 0;
        case "unavailable":
          return item.availability === "unavailable";
        case "recent":
          return Date.now() - Date.parse(item.createdAt) <= 7 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  }
  return {
    items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    total: items.length
  };
}

export async function updateAssetUsageForArticle(articleId: string, imageSources: string[]): Promise<void> {
  const sourceSet = new Set(imageSources);
  const assets = await listImageAssets();
  await Promise.all(
    assets.map(async (asset) => {
      const referenced = isAssetReferenced(asset, sourceSet);
      const usedBy = new Set(asset.usedByArticleIds);
      if (referenced) {
        usedBy.add(articleId);
      } else {
        usedBy.delete(articleId);
      }
      const nextUsedByArticleIds = Array.from(usedBy);
      if (nextUsedByArticleIds.join("|") !== asset.usedByArticleIds.join("|")) {
        await saveImageAsset({ ...asset, usedByArticleIds: nextUsedByArticleIds });
      }
    })
  );
}

function toImageLibraryItem(asset: ImageAsset, articleMap: Map<string, Article>): ImageLibraryItem {
  const usedByArticles = asset.usedByArticleIds
    .map((articleId) => articleMap.get(articleId))
    .filter((article): article is Article => Boolean(article))
    .map((article) => ({
      articleId: article.articleId,
      title: article.title,
      status: article.status
    }));
  return {
    ...asset,
    availability: asset.publicUrl ? "ok" : "unavailable",
    usageCount: usedByArticles.length,
    usedByArticles,
    cleanupCandidate: usedByArticles.length === 0
  };
}

function isAssetReferenced(asset: ImageAsset, imageSources: Set<string>): boolean {
  for (const source of imageSources) {
    if (source === asset.publicUrl || source === asset.objectPath || source.endsWith(asset.objectPath)) {
      return true;
    }
  }
  return false;
}
