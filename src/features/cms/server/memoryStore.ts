import type { Article, ArticleVersion, AuditEvent, ContentExport, ImageAsset, MigrationReport } from "../types.ts";

export interface CmsMemoryStore {
  articles: Article[];
  versions: ArticleVersion[];
  assets: ImageAsset[];
  auditEvents: AuditEvent[];
  exports: ContentExport[];
  migrationReports: MigrationReport[];
}

type GlobalWithCmsMemory = typeof globalThis & {
  __cmsMemoryStore?: CmsMemoryStore;
};

const globalStore = globalThis as GlobalWithCmsMemory;

export function getCmsMemoryStore(): CmsMemoryStore {
  if (!globalStore.__cmsMemoryStore) {
    globalStore.__cmsMemoryStore = {
      articles: [],
      versions: [],
      assets: [],
      auditEvents: [],
      exports: [],
      migrationReports: []
    };
  }
  return globalStore.__cmsMemoryStore;
}
