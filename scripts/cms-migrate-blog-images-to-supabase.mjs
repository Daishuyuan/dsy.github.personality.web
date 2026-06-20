#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { basename, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getCmsEnv } from "../src/features/cms/server/env.ts";
import { requireCmsDatabase } from "../src/features/cms/server/mongo.ts";
import { saveArticleDraft } from "../src/features/cms/server/articleService.ts";
import { saveImageAsset } from "../src/features/cms/server/assetRepository.ts";
import { writeAuditEvent } from "../src/features/cms/server/auditRepository.ts";
import { getSupabaseStorageClient } from "../src/features/cms/server/storageClient.ts";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = join(rootDir, "public");
const blogImagePrefix = "/assets/blogImg/";
const localObjectPrefix = "legacy-blog-img";
const remoteObjectPrefix = "legacy-remote-img";
const maxImageBytes = 5 * 1024 * 1024;
const apply = process.argv.includes("--apply");
const includeRemote = process.argv.includes("--include-remote");

try {
  const report = await migrateBlogImages({ apply });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
}

async function migrateBlogImages({ apply }) {
  const env = getCmsEnv();
  const database = await requireCmsDatabase();
  const articles = await database.collection("articles").find({}).sort({ publishedDate: -1, updatedAt: -1 }).toArray();
  const localReferences = collectLocalImageReferences(articles);
  const remoteReferences = includeRemote ? collectRemoteImageReferences(articles) : [];
  const missing = localReferences.filter((reference) => !existsSync(reference.localPath));

  if (missing.length > 0) {
    return {
      mode: apply ? "apply" : "dry-run",
      passed: false,
      reason: "missing-local-image-files",
      missing: missing.map((reference) => ({ url: reference.url, localPath: reference.localPath })),
      articleCount: articles.length,
      localImageReferenceCount: localReferences.length
    };
  }

  const plannedLocalAssets = await Promise.all(localReferences.map((reference) => toPlannedLocalAsset(reference, env.supabaseStorageBucket)));
  const remotePlan = includeRemote ? await planRemoteAssets(remoteReferences, env.supabaseStorageBucket) : { assets: [], skipped: [] };
  const plannedAssets = [...plannedLocalAssets, ...remotePlan.assets];
  const mapping = new Map(plannedAssets.map((asset) => [asset.sourceUrl, asset.publicUrl]));
  const articlePlans = articles
    .map((article) => {
      const nextMarkdown = replaceMappedUrls(article.markdown, mapping);
      return {
        article,
        nextMarkdown,
        changed: nextMarkdown !== article.markdown
      };
    })
    .filter((plan) => plan.changed);

  if (!apply) {
    return {
      mode: "dry-run",
      passed: true,
      articleCount: articles.length,
      articlesToUpdate: articlePlans.length,
      uniqueLocalImages: plannedLocalAssets.length,
      includeRemote,
      migratableRemoteImages: remotePlan.assets.length,
      skippedRemoteImages: remotePlan.skipped.length,
      supabaseBucket: env.supabaseStorageBucket,
      samples: plannedAssets.slice(0, 8).map((asset) => ({
        sourceUrl: asset.sourceUrl,
        objectPath: asset.objectPath,
        publicUrl: asset.publicUrl
      })),
      skippedRemoteSamples: remotePlan.skipped.slice(0, 8)
    };
  }

  const client = getSupabaseStorageClient();
  if (!client) {
    throw new Error("Supabase storage is not configured.");
  }

  const uploadedAssets = [];
  for (const asset of plannedAssets) {
    const fileBuffer = asset.buffer ?? (await readFile(asset.localPath));
    const { error } = await client.storage.from(env.supabaseStorageBucket).upload(asset.objectPath, fileBuffer, {
      contentType: asset.contentType,
      upsert: true
    });
    if (error) {
      throw new Error(`Supabase upload failed for ${asset.sourceUrl}: ${error.message}`);
    }
    await saveImageAsset(assetToRecord(asset));
    await writeAuditEvent({
      action: "asset.upload",
      actor: "migration",
      assetId: asset.assetId,
      details: { sourceUrl: asset.sourceUrl, objectPath: asset.objectPath, migration: "legacy-blog-img" }
    });
    uploadedAssets.push(asset);
  }

  const updatedArticles = [];
  for (const plan of articlePlans) {
    const article = plan.article;
    const saved = await saveArticleDraft(
      {
        articleId: article.articleId,
        legacyPath: article.legacyPath,
        title: article.title,
        publishedDate: article.publishedDate,
        tags: article.tags,
        toc: article.toc,
        status: article.status,
        markdown: plan.nextMarkdown,
        expectedVersion: article.version,
        sourceKind: article.sourceKind
      },
      "migration"
    );
    updatedArticles.push({ articleId: saved.articleId, title: saved.title, fromVersion: article.version, toVersion: saved.version });
  }

  return {
    mode: "apply",
    passed: true,
    articleCount: articles.length,
    updatedArticleCount: updatedArticles.length,
    uploadedAssetCount: uploadedAssets.length,
    includeRemote,
    skippedRemoteImages: remotePlan.skipped.length,
    supabaseBucket: env.supabaseStorageBucket,
    updatedArticles,
    uploadedAssets: uploadedAssets.map((asset) => ({
      sourceUrl: asset.sourceUrl,
      objectPath: asset.objectPath,
      publicUrl: asset.publicUrl
    })),
    skippedRemoteSamples: remotePlan.skipped.slice(0, 8)
  };
}

function collectLocalImageReferences(articles) {
  const byUrl = new Map();
  for (const article of articles) {
    const urls = extractLocalBlogImageUrls(`${article.markdown ?? ""}\n${article.renderedHtml ?? ""}`);
    for (const url of urls) {
      if (!byUrl.has(url)) {
        byUrl.set(url, {
          url,
          localPath: toLocalPublicPath(url),
          articleIds: []
        });
      }
      byUrl.get(url).articleIds.push(article.articleId);
    }
  }
  return Array.from(byUrl.values()).sort((a, b) => a.url.localeCompare(b.url));
}

function collectRemoteImageReferences(articles) {
  const byUrl = new Map();
  for (const article of articles) {
    const urls = extractArticleImageUrls(`${article.markdown ?? ""}\n${article.renderedHtml ?? ""}`).filter(
      (url) => url.startsWith("http") && !isSupabaseBlogImageUrl(url)
    );
    for (const url of urls) {
      if (!byUrl.has(url)) {
        byUrl.set(url, { url, articleIds: [] });
      }
      byUrl.get(url).articleIds.push(article.articleId);
    }
  }
  return Array.from(byUrl.values()).sort((a, b) => a.url.localeCompare(b.url));
}

function extractLocalBlogImageUrls(text) {
  return Array.from(new Set(Array.from(String(text).matchAll(/\/assets\/blogImg\/[^\s"'()<>)]+/g)).map((match) => match[0])));
}

function extractArticleImageUrls(text) {
  const urls = new Set();
  for (const match of String(text).matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    urls.add(match[1].trim());
  }
  for (const match of String(text).matchAll(/!\[[^\]]*]\(([^)]+)\)/g)) {
    urls.add(match[1].trim());
  }
  for (const match of String(text).matchAll(/^[ \t]{0,3}\[[^\]]+]:[ \t]*(\S+)/gm)) {
    urls.add(match[1].trim().replace(/^<|>$/g, ""));
  }
  return Array.from(urls);
}

function toLocalPublicPath(url) {
  const decodedUrl = decodeURIComponent(url);
  const normalized = normalize(join(publicDir, decodedUrl.slice(1)));
  if (!normalized.startsWith(publicDir)) {
    throw new Error(`Unsafe asset path: ${url}`);
  }
  return normalized;
}

async function toPlannedLocalAsset(reference, bucket) {
  const buffer = await readFile(reference.localPath);
  const fileStat = await stat(reference.localPath);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const originalName = basename(reference.localPath);
  const objectPath = `${localObjectPrefix}/${hash.slice(0, 16)}-${sanitizeObjectName(originalName)}`;
  const publicUrl = getPublicUrl(bucket, objectPath);

  return {
    sourceUrl: reference.url,
    localPath: reference.localPath,
    assetId: `asset_legacy_${hash.slice(0, 24)}`,
    storageProvider: "supabase-storage",
    bucket,
    objectPath,
    publicUrl,
    originalName,
    contentType: contentTypeFor(reference.localPath),
    sizeBytes: fileStat.size,
    usedByArticleIds: Array.from(new Set(reference.articleIds)),
    createdAt: new Date().toISOString(),
    createdBy: "migration"
  };
}

async function planRemoteAssets(references, bucket) {
  const assets = [];
  const skipped = [];
  for (const reference of references) {
    const fetched = await fetchRemoteImage(reference.url);
    if (!fetched.ok) {
      skipped.push({ sourceUrl: reference.url, reason: fetched.reason, status: fetched.status, contentType: fetched.contentType });
      continue;
    }
    const urlHash = createHash("sha256").update(reference.url).digest("hex");
    const contentHash = createHash("sha256").update(fetched.buffer).digest("hex");
    const host = sanitizeObjectName(new URL(reference.url).host).replace(/\.[a-z0-9]+$/, "");
    const objectPath = `${remoteObjectPrefix}/${urlHash.slice(0, 16)}-${host}${extensionForContentType(fetched.contentType)}`;
    const publicUrl = getPublicUrl(bucket, objectPath);
    assets.push({
      sourceUrl: reference.url,
      buffer: fetched.buffer,
      assetId: `asset_remote_${urlHash.slice(0, 24)}`,
      storageProvider: "supabase-storage",
      bucket,
      objectPath,
      publicUrl,
      originalName: `${host}-${contentHash.slice(0, 8)}${extensionForContentType(fetched.contentType)}`,
      contentType: fetched.contentType,
      sizeBytes: fetched.buffer.length,
      usedByArticleIds: Array.from(new Set(reference.articleIds)),
      createdAt: new Date().toISOString(),
      createdBy: "migration"
    });
  }
  return { assets, skipped };
}

async function fetchRemoteImage(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 dsy-blog-image-migration" }
    });
    clearTimeout(timer);
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (response.status !== 200) {
      await response.body?.cancel?.();
      return { ok: false, reason: "non-200", status: response.status, contentType };
    }
    if (!contentType.startsWith("image/")) {
      await response.body?.cancel?.();
      return { ok: false, reason: "not-image", status: response.status, contentType };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxImageBytes) {
      return { ok: false, reason: "too-large", status: response.status, contentType };
    }
    return { ok: true, status: response.status, contentType, buffer };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.name : "fetch-error" };
  }
}

function assetToRecord(asset) {
  return {
    assetId: asset.assetId,
    storageProvider: asset.storageProvider,
    bucket: asset.bucket,
    objectPath: asset.objectPath,
    publicUrl: asset.publicUrl,
    originalName: asset.originalName,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    usedByArticleIds: asset.usedByArticleIds,
    createdAt: asset.createdAt,
    createdBy: asset.createdBy
  };
}

function getPublicUrl(bucket, objectPath) {
  const client = getSupabaseStorageClient();
  if (!client) {
    return "";
  }
  return client.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

function isSupabaseBlogImageUrl(url) {
  return url.includes(".supabase.co/storage/v1/object/public/blog-images/");
}

function replaceMappedUrls(markdown, mapping) {
  let next = markdown;
  for (const [sourceUrl, publicUrl] of mapping) {
    next = next.split(sourceUrl).join(publicUrl);
  }
  return normalizeSupabaseImageUrlWhitespace(next);
}

function normalizeSupabaseImageUrlWhitespace(markdown) {
  return markdown.replace(
    /(https:\/\/[^"'\s)>]+\.supabase\.co\/storage\/v1\/object\/public\/blog-images\/[^"'\s)>]+)\s+(?=["')>])/g,
    "$1"
  );
}

function sanitizeObjectName(fileName) {
  const originalExt = extname(fileName);
  const ext = originalExt.toLowerCase();
  const base = basename(fileName, originalExt)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "image"}${ext}`;
}

function contentTypeFor(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function extensionForContentType(contentType) {
  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".img";
  }
}
