import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const postsDir = fileURLToPath(new URL("../src/content/blog/", import.meta.url));

for (const file of await readdir(postsDir)) {
  if (!file.endsWith(".md")) continue;

  const path = join(postsDir, file);
  const original = await readFile(path, "utf8");
  let normalized = original
    .replace(/^\uFEFF/, "")
    .replaceAll("http://latex.codecogs.com", "https://latex.codecogs.com")
    .replaceAll("<!--more-->", "<!-- more -->");

  if (!/^legacyPath:/m.test(normalized)) {
    const dateMatch = normalized.match(/^date:\s*([0-9]{4})-([0-9]{2})-([0-9]{2})/m);
    if (!dateMatch) {
      throw new Error(`Missing date in ${file}`);
    }

    const [, year, month, day] = dateMatch;
    const slug = basename(file, ".md");
    normalized = normalized.replace(
      /^date:\s*(.+)$/m,
      `date: $1\nlegacyPath: "/${year}/${month}/${day}/${slug}/"`
    );
  }

  if (normalized !== original) {
    await writeFile(path, normalized, "utf8");
  }
}
