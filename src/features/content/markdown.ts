import { createHash } from "node:crypto";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const safeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
    "iframe",
    "mark",
    "span",
    "div"
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...((defaultSchema.attributes?.["*"] as unknown[]) ?? []),
      "className",
      "id",
      "title",
      "aria-label"
    ],
    img: [
      ...((defaultSchema.attributes?.img as unknown[]) ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading"
    ],
    a: [...((defaultSchema.attributes?.a as unknown[]) ?? []), "href", "target", "rel"],
    iframe: ["src", "title", "width", "height", "loading", "allow", "allowfullscreen", "referrerpolicy"],
    code: [...((defaultSchema.attributes?.code as unknown[]) ?? []), "className"]
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"],
    href: ["http", "https", "mailto", "tel"]
  }
};

export interface RenderedMarkdown {
  html: string;
  contentHash: string;
  codeBlockCount: number;
  imageSources: string[];
  textSample: string;
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, safeSchema)
    .use(rehypeStringify)
    .process(markdown);
  const html = String(file);
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
  const html = Array.from(markdown.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((match) => match[1].trim());
  return Array.from(new Set([...inline, ...html]));
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
