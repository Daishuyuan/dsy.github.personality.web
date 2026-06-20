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

export async function renderMarkdownHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, safeSchema)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
