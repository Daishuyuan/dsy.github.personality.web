import { createHash } from "node:crypto";
import type { ContentExport } from "../types.ts";
import { listOwnerArticles } from "./articleRepository.ts";
import { listImageAssets } from "./assetRepository.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";

export async function createContentExport(actor = "owner") {
  const articles = await listOwnerArticles({ page: 1, pageSize: 1000 });
  const assets = await listImageAssets();
  const versions = await listAllVersions();
  const payload = {
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    articles: articles.items,
    assets,
    versions
  };
  const contentHash = `sha256:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
  const record: ContentExport = {
    exportId: `export_${Date.now()}`,
    formatVersion: 1,
    articleCount: articles.total,
    assetCount: assets.length,
    includedStatuses: ["draft", "published", "archived"],
    contentHash,
    createdAt: payload.createdAt,
    createdBy: actor,
    manifest: { contentHash, articleCount: articles.total, assetCount: assets.length }
  };
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<ContentExport>("content_exports").insertOne(record);
  } else {
    getCmsMemoryStore().exports.push(record);
  }
  await writeAuditEvent({ action: "export.run", actor, details: { exportId: record.exportId, articleCount: record.articleCount } });
  return { manifest: record, payload };
}

async function listAllVersions() {
  const database = await getCmsDatabase();
  if (database) {
    return database.collection("article_versions").find({}).sort({ createdAt: -1 }).toArray();
  }
  return getCmsMemoryStore().versions;
}
