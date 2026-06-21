import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { mapLocalMarkdownFile } from "../server/localArticleMapper.ts";

let tempDir = "";

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("local article mapper", () => {
  it("parses YAML frontmatter and markdown content without gray-matter", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "cms-local-article-"));
    const filePath = join(tempDir, "sample-note.md");
    await writeFile(
      filePath,
      [
        "---",
        "title: Sample Note",
        "date: 2026-06-20",
        "legacyPath: /2026/06/20/sample-note/",
        "tags:",
        "  - 算法",
        "  - CMS",
        "toc: false",
        "---",
        "# Sample Note",
        "",
        "Body text."
      ].join("\n"),
      "utf8"
    );

    const article = await mapLocalMarkdownFile(filePath);

    expect(article.title).toBe("Sample Note");
    expect(article.legacyPath).toBe("/2026/06/20/sample-note/");
    expect(article.publishedDate).toBe("2026-06-20T00:00:00.000Z");
    expect(article.tags).toEqual(["算法", "CMS"]);
    expect(article.toc).toBe(false);
    expect(article.markdown).toContain("Body text.");
    expect(article.renderedHtml).toContain("Body text.");
  });
});
