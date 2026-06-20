import type { ImageAsset } from "../types.ts";
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

function isAssetReferenced(asset: ImageAsset, imageSources: Set<string>): boolean {
  for (const source of imageSources) {
    if (source === asset.publicUrl || source === asset.objectPath || source.endsWith(asset.objectPath)) {
      return true;
    }
  }
  return false;
}
