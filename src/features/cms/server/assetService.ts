import { randomUUID } from "node:crypto";
import type { Article, ImageAsset } from "../types.ts";
import { extractImageSources } from "../../content/markdown.ts";
import { listOwnerArticles } from "./articleRepository.ts";
import { deleteImageAssetRecord, getImageAssetById, listImageLibraryItems, saveImageAsset } from "./assetRepository.ts";
import { MAX_IMAGE_BYTES, uploadSchema } from "../validation.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { getCmsEnv } from "./env.ts";
import { getSupabaseStorageClient } from "./storageClient.ts";
import { CmsApiError } from "./apiResponse.ts";

export interface UploadImageInput {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  dataBase64?: string;
  articleId?: string;
}

export async function uploadImage(input: UploadImageInput, actor = "owner"): Promise<ImageAsset> {
  const validated = uploadSchema.parse(input);
  const assetId = `asset_${randomUUID()}`;
  const env = getCmsEnv();
  const objectPath = createObjectPath(validated.fileName);
  const client = getSupabaseStorageClient();
  let publicUrl = `/assets/uploads/${objectPath}`;

  if (client && input.dataBase64) {
    const buffer = Buffer.from(input.dataBase64, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error("图片过大。");
    }
    const { error } = await client.storage
      .from(env.supabaseStorageBucket)
      .upload(objectPath, buffer, { contentType: validated.contentType, upsert: false });
    if (error) {
      await writeAuditEvent({ action: "storage.failure", actor, details: { message: error.message } });
      throw new Error("图片上传失败。");
    }
    const { data } = client.storage.from(env.supabaseStorageBucket).getPublicUrl(objectPath);
    publicUrl = data.publicUrl;
  }

  const asset: ImageAsset = {
    assetId,
    storageProvider: client ? "supabase-storage" : "memory",
    bucket: env.supabaseStorageBucket,
    objectPath,
    publicUrl,
    originalName: sanitizeFileName(validated.fileName),
    contentType: validated.contentType,
    sizeBytes: validated.sizeBytes,
    usedByArticleIds: validated.articleId ? [validated.articleId] : [],
    createdAt: new Date().toISOString(),
    createdBy: actor
  };
  await saveImageAsset(asset);
  await writeAuditEvent({ action: "asset.upload", actor, assetId, articleId: validated.articleId, details: { contentType: asset.contentType } });
  return asset;
}

export async function listImageLibrary(query: {
  state: "all" | "used" | "unused" | "unavailable" | "recent";
  q?: string;
  page: number;
  pageSize: number;
}) {
  const articles = await listAllOwnerArticles();
  return listImageLibraryItems(query, articles);
}

export async function deleteUnusedImageAsset(assetId: string, actor = "owner") {
  const asset = await getImageAssetById(assetId);
  if (!asset) {
    throw new CmsApiError("NOT_FOUND", "图片不存在。");
  }

  const articles = await listAllOwnerArticles();
  const referencingArticle = articles.find((article) => isAssetReferencedByArticle(asset, article));
  if (referencingArticle) {
    throw new CmsApiError("CONFLICT", "图片仍被文章引用，不能删除。");
  }

  if (asset.storageProvider === "supabase-storage") {
    const client = getSupabaseStorageClient();
    if (!client) {
      throw new CmsApiError("STORAGE_FAILURE", "图片存储未配置，无法删除对象。");
    }
    const { error } = await client.storage.from(asset.bucket).remove([asset.objectPath]);
    if (error) {
      await writeAuditEvent({ action: "storage.failure", actor, assetId: asset.assetId, details: { message: error.message } });
      throw new CmsApiError("STORAGE_FAILURE", "图片删除失败。");
    }
  }

  await deleteImageAssetRecord(asset.assetId);
  await writeAuditEvent({
    action: "asset.delete",
    actor,
    assetId: asset.assetId,
    details: {
      originalName: asset.originalName,
      storageProvider: asset.storageProvider,
      objectPath: asset.objectPath
    }
  });
  return { assetId: asset.assetId, deleted: true };
}

function createObjectPath(fileName: string): string {
  const now = new Date();
  const safeName = sanitizeFileName(fileName);
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}-${safeName}`;
}

function sanitizeFileName(fileName: string): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : "";
  const base = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "image"}${ext}`;
}

async function listAllOwnerArticles() {
  const firstPage = await listOwnerArticles({ page: 1, pageSize: 500 });
  return firstPage.items;
}

function isAssetReferencedByArticle(asset: ImageAsset, article: Article): boolean {
  const htmlSources = Array.from(article.renderedHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((match) => match[1].trim());
  const sources = new Set([...extractImageSources(article.markdown), ...htmlSources]);
  for (const source of sources) {
    if (source === asset.publicUrl || source === asset.objectPath || source.endsWith(asset.objectPath)) {
      return true;
    }
  }
  return false;
}
