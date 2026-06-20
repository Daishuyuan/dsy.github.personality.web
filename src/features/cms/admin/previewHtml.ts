import { renderMarkdownHtml } from "../../content/markdownHtml";

const unresolvedReferenceImagePattern = /!\[[^\]]*]\[[^\]]+]/;
const imageTagPattern = /<img\b/i;

export async function renderArticlePreviewHtml(markdown: string, fallbackHtml = ""): Promise<string> {
  const rendered = await renderMarkdownHtml(markdown);
  if (hasUnresolvedReferenceImage(rendered) && hasRenderedImage(fallbackHtml)) {
    return fallbackHtml;
  }
  return rendered;
}

function hasUnresolvedReferenceImage(html: string): boolean {
  return unresolvedReferenceImagePattern.test(html);
}

function hasRenderedImage(html: string): boolean {
  return imageTagPattern.test(html);
}
