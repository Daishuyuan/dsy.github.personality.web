import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../markdown";

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
});
