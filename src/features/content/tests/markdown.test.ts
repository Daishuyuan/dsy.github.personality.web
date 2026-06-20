import { describe, expect, it } from "vitest";
import { extractImageSources, renderMarkdown } from "../markdown";

describe("Markdown rendering", () => {
  it("renders GFM tables and code blocks", async () => {
    const rendered = await renderMarkdown("| a |\n| - |\n| b |\n\n```js\nconsole.log(1)\n```");
    expect(rendered.html).toContain("<table>");
    expect(rendered.codeBlockCount).toBe(1);
  });

  it("removes script tags from unsafe content", async () => {
    const rendered = await renderMarkdown("# Safe\n\n<script>alert(1)</script>");
    expect(rendered.html).toContain("<h1>Safe</h1>");
    expect(rendered.html).not.toContain("<script>");
  });

  it("renders and tracks reference-style images used by legacy posts", async () => {
    const markdown = "![田螺旋棋6*6][1]\n\n  [1]: /assets/blogImg/Surakarta.png";
    const rendered = await renderMarkdown(markdown);

    expect(rendered.html).toContain('<img src="/assets/blogImg/Surakarta.png" alt="田螺旋棋6*6">');
    expect(extractImageSources(markdown)).toEqual(["/assets/blogImg/Surakarta.png"]);
  });

  it("renders the legacy cover image followed by the Game of Thrones quote", async () => {
    const markdown = [
      "![封面][2]",
      '***&emsp;&emsp;"You know nothing." --《Game of Thrones》***',
      "",
      "[2]: https://example.com/cover.jpg"
    ].join("\n");
    const rendered = await renderMarkdown(markdown);

    expect(rendered.html).toContain('<img src="https://example.com/cover.jpg" alt="封面">');
    expect(rendered.html).toContain('"You know nothing." --《Game of Thrones》');
    expect(rendered.html).not.toContain("![封面][2]");
    expect(extractImageSources(markdown)).toEqual(["https://example.com/cover.jpg"]);
  });
});
