import { createHash } from "node:crypto";
import { renderMarkdownHtml } from "./markdownHtml.ts";

export interface RenderedMarkdown {
  html: string;
  contentHash: string;
  codeBlockCount: number;
  imageSources: string[];
  textSample: string;
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const html = await renderMarkdownHtml(markdown);
  return {
    html,
    contentHash: createContentHash(markdown),
    codeBlockCount: countCodeBlocks(markdown),
    imageSources: extractImageSources(markdown),
    textSample: markdown.replace(/\s+/g, " ").slice(0, 180)
  };
}

export function createContentHash(markdown: string): string {
  return `sha256:${createHash("sha256").update(markdown).digest("hex")}`;
}

export function countCodeBlocks(markdown: string): number {
  return (markdown.match(/```/g)?.length ?? 0) / 2;
}

export function extractImageSources(markdown: string): string[] {
  const inline = Array.from(markdown.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)).map((match) => match[1].trim());
  const definitions = imageReferenceDefinitions(markdown);
  const reference = Array.from(markdown.matchAll(/!\[[^\]]*]\[([^\]]+)]/g))
    .map((match) => definitions.get(normalizeReferenceLabel(match[1])))
    .filter((value): value is string => Boolean(value));
  const html = Array.from(markdown.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((match) => match[1].trim());
  return Array.from(new Set([...inline, ...reference, ...html]));
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function imageReferenceDefinitions(markdown: string): Map<string, string> {
  const definitions = new Map<string, string>();
  for (const match of markdown.matchAll(/^[ \t]{0,3}\[([^\]]+)]:[ \t]*(\S+)/gm)) {
    definitions.set(normalizeReferenceLabel(match[1]), normalizeReferenceUrl(match[2]));
  }
  return definitions;
}

function normalizeReferenceLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeReferenceUrl(value: string): string {
  return value.trim().replace(/^<|>$/g, "");
}
