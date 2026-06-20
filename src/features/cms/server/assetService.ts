import { randomUUID } from "node:crypto";
import type { ImageAsset } from "../types.ts";
import { MAX_IMAGE_BYTES, uploadSchema } from "../validation.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { getCmsEnv } from "./env.ts";
import { saveImageAsset } from "./assetRepository.ts";
import { getSupabaseStorageClient } from "./storageClient.ts";

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
