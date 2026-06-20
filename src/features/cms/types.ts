export type ArticleStatus = "draft" | "published" | "archived";

export type ArticleSourceKind = "imported-local" | "owner-created";

export interface Article {
  articleId: string;
  legacyPath: string;
  slugSegments: string[];
  title: string;
  publishedDate: string;
  tags: string[];
  toc: boolean;
  status: ArticleStatus;
  markdown: string;
  renderedHtml: string;
  excerpt?: string;
  contentHash: string;
  sourceKind: ArticleSourceKind;
  version: number;
  lastVersionId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export type ArticleVersionReason = "save" | "publish" | "archive" | "rollback" | "import";

export interface ArticleVersion {
  versionId: string;
  articleId: string;
  fromVersion: number;
  snapshot: Article;
  reason: ArticleVersionReason;
  createdAt: string;
  createdBy: string;
  restoredFromVersionId?: string;
}

export interface ImageAsset {
  assetId: string;
  storageProvider: "supabase-storage" | "memory";
  bucket: string;
  objectPath: string;
  publicUrl: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  usedByArticleIds: string[];
  createdAt: string;
  createdBy: string;
}

export type AuditAction =
  | "article.create"
  | "article.update"
  | "article.publish"
  | "article.archive"
  | "article.rollback"
  | "asset.upload"
  | "import.run"
  | "export.run"
  | "auth.failure"
  | "storage.failure";

export interface AuditEvent {
  eventId: string;
  action: AuditAction;
  articleId?: string;
  assetId?: string;
  actor: string;
  requestId?: string;
  idempotencyKeyHash?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface ContentExport {
  exportId: string;
  formatVersion: number;
  articleCount: number;
  assetCount: number;
  includedStatuses: ArticleStatus[];
  contentHash: string;
  createdAt: string;
  createdBy: string;
  manifest: Record<string, unknown>;
}

export interface MigrationReport {
  reportId: string;
  mode: "dry-run" | "apply" | "verify";
  localArticleCount: number;
  dynamicArticleCount: number;
  missingArticleIds: string[];
  changedArticleIds: string[];
  duplicatePaths: string[];
  renderingMarkerMismatches: Array<Record<string, unknown>>;
  passed: boolean;
  createdAt: string;
}

export interface ArticleDraftInput {
  articleId?: string;
  legacyPath: string;
  title: string;
  publishedDate: string;
  tags: string[];
  toc: boolean;
  status: ArticleStatus;
  markdown: string;
  expectedVersion?: number;
  sourceKind?: ArticleSourceKind;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
