#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, posix, resolve } from "node:path";
import { spawn } from "node:child_process";

const { getCmsDatabase, getMongoClient } = await import("../src/features/cms/server/mongo.ts");
const { getCmsEnv } = await import("../src/features/cms/server/env.ts");
const { getSupabaseStorageClient } = await import("../src/features/cms/server/storageClient.ts");

const args = parseArgs(process.argv.slice(2));
const now = new Date();
const stamp = now.toISOString().replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
const outRoot = resolve(args.out ?? join("backups", `cms-${stamp}`));
const noArchive = args.noArchive === true;

await mkdir(outRoot, { recursive: true });

const { mongodb, collectionDocuments } = await writeMongoCollections(outRoot);
const cmsExport = await writePortableCmsExport(outRoot, collectionDocuments);
const storage = await writeStorageObjects(outRoot);

const manifest = {
  formatVersion: 1,
  createdAt: now.toISOString(),
  source: {
    mongodbDb: getCmsEnv().mongodbDb,
    supabaseStorageBucket: getCmsEnv().supabaseStorageBucket
  },
  cmsExport,
  mongodb,
  storage
};

const manifestHash = await writeJsonWithHash(join(outRoot, "manifest.json"), manifest);
const archivePath = noArchive ? null : await createArchive(outRoot);
const result = {
  outDir: outRoot,
  archivePath,
  manifest: {
    ...manifest,
    manifestHash
  }
};

console.log(JSON.stringify(result, null, 2));
await closeMongoClient();

async function writePortableCmsExport(root, collectionDocuments) {
  console.error("[cms-backup] writing CMS portable JSON");
  const archive = {
    manifest: {
      formatVersion: 1,
      articleCount: collectionDocuments.articles?.length ?? 0,
      assetCount: collectionDocuments.image_assets?.length ?? 0,
      versionCount: collectionDocuments.article_versions?.length ?? 0
    },
    payload: {
      formatVersion: 1,
      createdAt: now.toISOString(),
      articles: collectionDocuments.articles ?? [],
      assets: collectionDocuments.image_assets ?? [],
      versions: collectionDocuments.article_versions ?? []
    }
  };
  const file = join(root, "cms-export.json");
  const hash = await writeJsonWithHash(file, archive);
  return {
    file: relative(root, file),
    hash,
    articleCount: archive.manifest.articleCount,
    assetCount: archive.manifest.assetCount,
    versionCount: archive.manifest.versionCount
  };
}

async function writeMongoCollections(root) {
  console.error("[cms-backup] exporting MongoDB collections");
  const database = await getCmsDatabase();
  if (!database) {
    throw new Error("MONGODB_URI is not configured; cannot create a database backup.");
  }

  const collectionsDir = join(root, "mongodb", "collections");
  await mkdir(collectionsDir, { recursive: true });
  const collections = await database.listCollections({}, { nameOnly: true }).toArray();
  const exported = [];
  const collectionDocuments = {};

  for (const collectionInfo of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    if (collectionInfo.name.startsWith("system.")) {
      continue;
    }
    const documents = await database.collection(collectionInfo.name).find({}).toArray();
    collectionDocuments[collectionInfo.name] = documents;
    const file = join(collectionsDir, `${collectionInfo.name}.json`);
    const hash = await writeJsonWithHash(file, {
      collection: collectionInfo.name,
      count: documents.length,
      documents
    });
    exported.push({
      name: collectionInfo.name,
      count: documents.length,
      file: relative(root, file),
      hash
    });
  }

  return {
    mongodb: {
      dbName: getCmsEnv().mongodbDb,
      collectionCount: exported.length,
      collections: exported
    },
    collectionDocuments
  };
}

async function writeStorageObjects(root) {
  console.error("[cms-backup] exporting Supabase Storage objects");
  const client = getSupabaseStorageClient();
  const env = getCmsEnv();
  if (!client) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured; cannot back up storage objects.");
  }

  const objects = await listStorageObjects(client, env.supabaseStorageBucket);
  console.error(`[cms-backup] found ${objects.length} storage objects in ${env.supabaseStorageBucket}`);
  const storageDir = join(root, "storage", env.supabaseStorageBucket);
  let downloaded = 0;
  const manifest = await mapWithConcurrency(objects, 8, async (object) => {
    const objectPath = safeObjectPath(object.path);
    const localPath = join(storageDir, objectPath);
    await mkdir(dirname(localPath), { recursive: true });
    const bytes = await downloadStorageObject(client, env.supabaseStorageBucket, object.path);
    await writeFile(localPath, bytes);
    const hash = `sha256:${sha256(bytes)}`;
    downloaded += 1;
    if (downloaded % 10 === 0 || downloaded === objects.length) {
      console.error(`[cms-backup] downloaded ${downloaded}/${objects.length} storage objects`);
    }
    return {
      path: object.path,
      file: relative(root, localPath),
      sizeBytes: bytes.byteLength,
      hash,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt,
      metadata: object.metadata ?? null
    };
  });
  const totalBytes = manifest.reduce((sum, object) => sum + object.sizeBytes, 0);

  const manifestFile = join(root, "storage", "storage-manifest.json");
  const manifestHash = await writeJsonWithHash(manifestFile, {
    bucket: env.supabaseStorageBucket,
    objectCount: manifest.length,
    totalBytes,
    objects: manifest
  });

  return {
    bucket: env.supabaseStorageBucket,
    objectCount: manifest.length,
    totalBytes,
    file: relative(root, manifestFile),
    hash: manifestHash
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function downloadStorageObject(client, bucket, objectPath) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(objectPath, 60);
      if (error) {
        throw new Error(error.message);
      }
      const response = await fetchWithTimeout(data.signedUrl, 30_000);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.error(`[cms-backup] retrying ${objectPath} after ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  throw new Error(`Failed to download ${objectPath}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function listStorageObjects(client, bucket, prefix = "") {
  const objects = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" }
    });
    if (error) {
      throw new Error(`Failed to list bucket ${bucket}/${prefix}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      break;
    }
    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id && item.metadata !== null) {
        objects.push({
          path: itemPath,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          metadata: item.metadata
        });
      } else {
        objects.push(...(await listStorageObjects(client, bucket, itemPath)));
      }
    }
    if (data.length < 1000) {
      break;
    }
    offset += data.length;
  }

  return objects.sort((a, b) => a.path.localeCompare(b.path));
}

async function createArchive(root) {
  const archivePath = `${root}.tar.gz`;
  await run("tar", ["-czf", archivePath, "-C", root, "."]);
  return archivePath;
}

async function writeJsonWithHash(file, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
  return `sha256:${sha256(Buffer.from(text))}`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeObjectPath(value) {
  const normalized = posix.normalize(String(value));
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../") || normalized.startsWith("/")) {
    throw new Error(`Unsafe storage object path: ${value}`);
  }
  return normalized;
}

function relative(root, file) {
  return posix.join(...resolve(file).slice(resolve(root).length + 1).split(/[\\/]+/));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
      parsed.out = argv[index + 1];
      index += 1;
    } else if (arg === "--no-archive") {
      parsed.noArchive = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function run(command, commandArgs) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, commandArgs, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function closeMongoClient() {
  const client = await getMongoClient().catch(() => null);
  await client?.close();
}
