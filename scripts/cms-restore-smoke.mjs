#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const source = args.source ? resolve(args.source) : "";
if (!source) {
  throw new Error("Usage: npm run cms:restore-smoke -- --source <backup-dir-or-tar.gz>");
}

const extracted = source.endsWith(".tar.gz") ? await extractArchive(source) : source;
try {
  const report = await verifyBackup(extracted);
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (extracted !== source) {
    await rm(extracted, { recursive: true, force: true });
  }
}

async function verifyBackup(root) {
  const manifest = await readJson(join(root, "manifest.json"));
  const cmsExportText = await readText(join(root, manifest.cmsExport.file));
  assertHash(manifest.cmsExport.hash, cmsExportText, manifest.cmsExport.file);

  let documentCount = 0;
  for (const collection of manifest.mongodb.collections) {
    const text = await readText(join(root, collection.file));
    assertHash(collection.hash, text, collection.file);
    const payload = JSON.parse(text);
    if (payload.count !== collection.count || payload.documents.length !== collection.count) {
      throw new Error(`Collection count mismatch: ${collection.name}`);
    }
    documentCount += collection.count;
  }

  const storageManifestText = await readText(join(root, manifest.storage.file));
  assertHash(manifest.storage.hash, storageManifestText, manifest.storage.file);
  const storageManifest = JSON.parse(storageManifestText);
  let storageBytes = 0;
  for (const object of storageManifest.objects) {
    const bytes = await readFile(join(root, object.file));
    assertHash(object.hash, bytes, object.file);
    if (bytes.byteLength !== object.sizeBytes) {
      throw new Error(`Storage object size mismatch: ${object.path}`);
    }
    storageBytes += bytes.byteLength;
  }

  if (storageManifest.objectCount !== storageManifest.objects.length || storageBytes !== storageManifest.totalBytes) {
    throw new Error("Storage manifest totals do not match downloaded objects.");
  }

  return {
    ok: true,
    createdAt: manifest.createdAt,
    mongodb: {
      dbName: manifest.mongodb.dbName,
      collectionCount: manifest.mongodb.collectionCount,
      documentCount
    },
    storage: {
      bucket: manifest.storage.bucket,
      objectCount: storageManifest.objectCount,
      totalBytes: storageBytes
    }
  };
}

async function extractArchive(archivePath) {
  const dir = await mkdtemp(join(tmpdir(), "cms-backup-"));
  await run("tar", ["-xzf", archivePath, "-C", dir]);
  return dir;
}

async function readJson(file) {
  return JSON.parse(await readText(file));
}

async function readText(file) {
  return readFile(file, "utf8");
}

function assertHash(expected, value, label) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  if (actual !== expected) {
    throw new Error(`Hash mismatch for ${label}: expected ${expected}, got ${actual}`);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
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
