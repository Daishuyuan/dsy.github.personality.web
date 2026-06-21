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

export type HealthReportStatus = "passed" | "warning" | "failed";
export type HealthIssueSeverity = "info" | "warning" | "error";
export type HealthIssueCategory =
  | "article-route"
  | "article-identity"
  | "article-rendering"
  | "image-reference"
  | "asset-usage"
  | "storage"
  | "authorization"
  | "configuration";

export interface ContentHealthIssue {
  issueId: string;
  severity: HealthIssueSeverity;
  category: HealthIssueCategory;
  articleId?: string;
  assetId?: string;
  imageSource?: string;
  message: string;
  recommendedAction: string;
}

export interface ContentHealthReport {
  reportId: string;
  status: HealthReportStatus;
  checkedAt: string;
  checkedBy: string;
  articleCount: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  assetCount: number;
  issueCount: number;
  issues: ContentHealthIssue[];
  summary: string;
}

export type ImageAvailability = "ok" | "unavailable" | "unknown";
export type ImageUsageKind = "markdown-source" | "rendered-html" | "asset-record";

export interface ImageUsageReference {
  assetId?: string;
  imageSource: string;
  articleId: string;
  articleTitle: string;
  articleStatus: ArticleStatus;
  usageKind: ImageUsageKind;
  matched: boolean;
}

export interface ImageLibraryArticleRef {
  articleId: string;
  title: string;
  status: ArticleStatus;
}

export interface ImageLibraryItem extends ImageAsset {
  availability: ImageAvailability;
  usageCount: number;
  usedByArticles: ImageLibraryArticleRef[];
  cleanupCandidate: boolean;
}

export type VerificationRunStatus = "passed" | "failed" | "partial";
export type VerificationStepStatus = "passed" | "failed" | "skipped" | "blocked";

export interface VerificationStepResult {
  stepId: string;
  label: string;
  status: VerificationStepStatus;
  required: boolean;
  articleId?: string;
  assetId?: string;
  message: string;
  durationMs: number;
}

export interface VerificationRun {
  runId: string;
  status: VerificationRunStatus;
  startedAt: string;
  finishedAt: string;
  triggeredBy: string;
  steps: VerificationStepResult[];
  summary: string;
}

export interface OperationsSummary {
  content: {
    articleCount: number;
    publishedCount: number;
    draftCount: number;
    archivedCount: number;
    duplicatePathCount: number;
    missingRenderedCount: number;
  };
  assets: {
    assetCount: number;
    usedCount: number;
    unusedCount: number;
    unavailableCount: number;
  };
  activity: {
    latestEventAt?: string;
    recentFailureCount: number;
  };
  latestHealth?: Pick<ContentHealthReport, "status" | "checkedAt" | "issueCount"> & {
    issues?: ContentHealthIssue[];
  };
}

export interface ActivityRecord {
  eventId: string;
  action: AuditAction;
  actor: string;
  articleId?: string;
  assetId?: string;
  result: "success" | "failure" | "unknown";
  summary: string;
  createdAt: string;
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
  | "health.run"
  | "verification.run"
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
