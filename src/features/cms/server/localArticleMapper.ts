import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { load as parseYaml } from "js-yaml";
import type { Article } from "../types.ts";
import { getArticleIdForContentId } from "../../engagement/articleIdentity.ts";
import { renderMarkdown } from "../../content/markdown.ts";
import { normalizeLegacyPath, slugSegmentsFromPath } from "../validation.ts";

export async function mapLocalMarkdownFile(filePath: string): Promise<Article> {
  const raw = await readFile(filePath, "utf8");
  const parsed = parseFrontmatter(raw);
  const contentId = basename(filePath, ".md");
  const title = String(parsed.data.title ?? contentId);
  const date = normalizeDate(parsed.data.date);
  const legacyPath = normalizeLegacyPath(String(parsed.data.legacyPath ?? `/${date.slice(0, 10).replaceAll("-", "/")}/${title}/`));
  const rendered = await renderMarkdown(parsed.content);
  const now = new Date().toISOString();
  return {
    articleId: getArticleIdForContentId(contentId),
    legacyPath,
    slugSegments: slugSegmentsFromPath(legacyPath),
    title,
    publishedDate: date,
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
    toc: Boolean(parsed.data.toc ?? true),
    status: "published",
    markdown: parsed.content,
    renderedHtml: rendered.html,
    contentHash: rendered.contentHash,
    sourceKind: "imported-local",
    version: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  };
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

interface ParsedMarkdown {
  data: Record<string, unknown>;
  content: string;
}

function parseFrontmatter(raw: string): ParsedMarkdown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(raw);
  if (!match) {
    return { data: {}, content: raw };
  }

  const yaml = match[1] ?? "";
  const loaded = parseYaml(yaml);
  return {
    data: isRecord(loaded) ? loaded : {},
    content: raw.slice(match[0].length)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
