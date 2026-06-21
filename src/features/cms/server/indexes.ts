import { getCmsDatabase } from "./mongo.ts";

type GlobalWithCmsIndexes = typeof globalThis & {
  __cmsIndexesReady?: boolean;
};

const globalStore = globalThis as GlobalWithCmsIndexes;

export async function ensureCmsIndexes(): Promise<void> {
  if (globalStore.__cmsIndexesReady) {
    return;
  }
  const database = await getCmsDatabase();
  if (!database) {
    globalStore.__cmsIndexesReady = true;
    return;
  }

  await Promise.all([
    database.collection("articles").createIndex({ articleId: 1 }, { unique: true }),
    database.collection("articles").createIndex({ legacyPath: 1 }, { unique: true }),
    database.collection("articles").createIndex({ status: 1, publishedDate: -1, updatedAt: -1 }),
    database.collection("articles").createIndex({ status: 1, tags: 1, publishedDate: -1 }),
    database.collection("article_versions").createIndex({ versionId: 1 }, { unique: true }),
    database.collection("article_versions").createIndex({ articleId: 1, createdAt: -1 }),
    database.collection("image_assets").createIndex({ assetId: 1 }, { unique: true }),
    database.collection("image_assets").createIndex({ bucket: 1, objectPath: 1 }, { unique: true }),
    database.collection("audit_events").createIndex({ eventId: 1 }, { unique: true }),
    database.collection("audit_events").createIndex({ createdAt: -1 }),
    database.collection("audit_events").createIndex({ action: 1, createdAt: -1 }),
    database.collection("audit_events").createIndex({ articleId: 1, createdAt: -1 }),
    database.collection("audit_events").createIndex({ assetId: 1, createdAt: -1 }),
    database.collection("content_exports").createIndex({ exportId: 1 }, { unique: true }),
    database.collection("migration_reports").createIndex({ reportId: 1 }, { unique: true }),
    database.collection("health_reports").createIndex({ reportId: 1 }, { unique: true }),
    database.collection("health_reports").createIndex({ checkedAt: -1 }),
    database.collection("verification_runs").createIndex({ runId: 1 }, { unique: true }),
    database.collection("verification_runs").createIndex({ startedAt: -1 })
  ]);

  globalStore.__cmsIndexesReady = true;
}
