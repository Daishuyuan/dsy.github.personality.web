import { describe, expect, it } from "vitest";
import { renderArticlePreviewHtml } from "../admin/previewHtml";

describe("Article preview HTML rendering", () => {
  it("falls back to saved HTML when a reference-style cover is unresolved", async () => {
    const markdown = '![封面][2]\n*** "You know nothing." -- 《Game of Thrones》 ***';
    const fallbackHtml = '<p><img src="https://example.com/cover.jpg" alt="封面"></p>';

    await expect(renderArticlePreviewHtml(markdown, fallbackHtml)).resolves.toBe(fallbackHtml);
  });

  it("uses freshly rendered HTML when the reference-style cover can be resolved", async () => {
    const markdown = [
      "![封面][2]",
      '*** "You know nothing." -- 《Game of Thrones》 ***',
      "",
      "[2]: https://example.com/cover.jpg"
    ].join("\n");
    const html = await renderArticlePreviewHtml(markdown, '<p><img src="https://example.com/old.jpg" alt="旧封面"></p>');

    expect(html).toContain('<img src="https://example.com/cover.jpg" alt="封面">');
    expect(html).not.toContain("old.jpg");
    expect(html).not.toContain("![封面][2]");
  });
});
