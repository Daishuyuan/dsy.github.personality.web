import { z } from "zod";
import type { ArticleDraftInput, ArticleStatus, AuditAction } from "./types.ts";

export const ARTICLE_STATUS_VALUES = ["draft", "published", "archived"] as const;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_MARKDOWN_BYTES = 256 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const RESERVED_PATH_PREFIXES = [
  "/admin/",
  "/api/",
  "/assets/",
  "/visual-algorithms/",
  "/archives/",
  "/tags/"
] as const;
export const ASSET_FILTER_STATES = ["all", "used", "unused", "unavailable", "recent"] as const;
export const AUDIT_ACTION_VALUES = [
  "article.create",
  "article.update",
  "article.publish",
  "article.archive",
  "article.rollback",
  "asset.upload",
  "import.run",
  "export.run",
  "health.run",
  "verification.run",
  "auth.failure",
  "storage.failure"
] as const satisfies readonly AuditAction[];

const articleIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]{1,119}$/);

const tagSchema = z.string().trim().min(1).max(30);

export const articleDraftSchema = z.object({
  articleId: articleIdSchema.optional(),
  legacyPath: z.string().transform(normalizeLegacyPath).pipe(z.string().min(2).max(240)),
  title: z.string().trim().min(1).max(120),
  publishedDate: z.string().trim().min(4).max(40),
  tags: z.array(tagSchema).max(12).default([]),
  toc: z.boolean().default(true),
  status: z.enum(ARTICLE_STATUS_VALUES),
  markdown: z.string().min(1).refine((value) => Buffer.byteLength(value, "utf8") <= MAX_MARKDOWN_BYTES, {
    message: "markdown is too large"
  }),
  expectedVersion: z.number().int().positive().optional(),
  sourceKind: z.enum(["imported-local", "owner-created"]).optional()
});

export const paginationSchema = z.object({
  status: z.enum(ARTICLE_STATUS_VALUES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  q: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(30).optional()
});

export const rollbackSchema = z.object({
  versionId: z.string().trim().min(3).max(120),
  expectedVersion: z.number().int().positive()
});

export const versionActionSchema = z.object({
  expectedVersion: z.number().int().positive()
});

export const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(120),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
  articleId: articleIdSchema.optional()
});

export const operationsSummaryQuerySchema = z.object({
  includeIssues: z.coerce.boolean().default(false)
});

export const healthRunSchema = z.object({
  scope: z.enum(["all", "published"]).default("all"),
  includeDrafts: z.boolean().default(true),
  checkImageAvailability: z.boolean().default(false)
});

export const assetListQuerySchema = z.object({
  state: z.enum(ASSET_FILTER_STATES).default("all"),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20)
});

export const auditListQuerySchema = z.object({
  action: z.enum(AUDIT_ACTION_VALUES).optional(),
  articleId: articleIdSchema.optional(),
  assetId: z.string().trim().min(2).max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const verificationRunSchema = z.object({
  scope: z.enum(["cms-critical"]).default("cms-critical"),
  includePublicRead: z.boolean().default(true),
  includeEngagementIdentity: z.boolean().default(true)
});

export function parseArticleDraft(input: unknown): ArticleDraftInput {
  const draft = articleDraftSchema.parse(input);
  assertSafeLegacyPath(draft.legacyPath);
  return {
    ...draft,
    tags: uniqueTags(draft.tags)
  };
}

export function parseArticleId(value: unknown): string {
  return articleIdSchema.parse(String(value ?? ""));
}

export function parseStatus(value: unknown): ArticleStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return z.enum(ARTICLE_STATUS_VALUES).parse(value);
}

export function normalizeLegacyPath(value: string): string {
  let raw = String(value ?? "").trim();
  if (!raw.startsWith("/")) {
    raw = `/${raw}`;
  }
  raw = raw.replace(/\/+/g, "/");
  if (!raw.endsWith("/")) {
    raw = `${raw}/`;
  }
  try {
    raw = decodeURI(raw);
  } catch {
    // Keep raw if it is not a valid URI; validation below will reject unsafe control paths.
  }
  return raw;
}

export function assertSafeLegacyPath(path: string): void {
  if (path.includes("..") || path.includes("?") || path.includes("#") || /[\u0000-\u001f]/.test(path)) {
    throw new Error("RESERVED_PATH");
  }
  const lower = path.toLowerCase();
  if (RESERVED_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    throw new Error("RESERVED_PATH");
  }
}

export function slugSegmentsFromPath(path: string): string[] {
  return normalizeLegacyPath(path).split("/").filter(Boolean);
}

export function createSlugFromTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}
