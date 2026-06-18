import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const distDir = join(rootDir, "dist");
const attrPattern = /\s(?:href|src)=["']([^"']+)["']/g;

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) return walkHtmlFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".html")) return [fullPath];
      return [];
    })
  );

  return paths.flat();
}

function safeDecodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function toGeneratedPath(value, htmlFile) {
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:")
  ) {
    return null;
  }

  const url = new URL(value, "https://local.test/");
  if (url.origin !== "https://local.test") return null;

  const pathname = safeDecodePath(url.pathname);
  if (pathname === "/") return join(distDir, "index.html");

  const basePath = pathname.startsWith("/")
    ? join(distDir, pathname.slice(1))
    : join(dirname(htmlFile), pathname);

  if (pathname.endsWith("/")) return join(basePath, "index.html");
  if (extname(basePath)) return basePath;
  return join(basePath, "index.html");
}

const missing = [];
const htmlFiles = await walkHtmlFiles(distDir);

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  for (const match of html.matchAll(attrPattern)) {
    const generatedPath = toGeneratedPath(match[1], htmlFile);
    if (generatedPath && !(await exists(generatedPath))) {
      missing.push({
        file: htmlFile.replace(`${rootDir}/`, ""),
        reference: match[1],
        expected: generatedPath.replace(`${rootDir}/`, "")
      });
    }
  }
}

if (missing.length > 0) {
  console.error(JSON.stringify({ htmlFiles: htmlFiles.length, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ htmlFiles: htmlFiles.length, missing }, null, 2));
