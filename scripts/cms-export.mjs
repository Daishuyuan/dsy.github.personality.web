#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const { createContentExport } = await import("../src/features/cms/server/exportService.ts");

const outIndex = process.argv.indexOf("--out");
const outDir = outIndex >= 0 ? process.argv[outIndex + 1] : "";
const archive = await createContentExport("owner");

if (outDir) {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(archive.manifest, null, 2));
  await writeFile(join(outDir, "articles.json"), JSON.stringify(archive.payload.articles, null, 2));
  await writeFile(join(outDir, "image-assets.json"), JSON.stringify(archive.payload.assets, null, 2));
  await writeFile(join(outDir, "versions.json"), JSON.stringify(archive.payload.versions, null, 2));
  console.log(JSON.stringify({ outDir, manifest: archive.manifest }, null, 2));
} else {
  console.log(JSON.stringify(archive, null, 2));
}
