import { describe, expect, it } from "vitest";
import { AUTHOR_MAX_LENGTH, COMMENT_MAX_LENGTH, normalizeArticleId, validateCommentDraft } from "../validation";

describe("engagement validation", () => {
  it("accepts stable article ids and anonymous comment drafts", () => {
    expect(normalizeArticleId("post:20180301-algorithm-js-misc-1")).toBe(
      "post:20180301-algorithm-js-misc-1"
    );

    expect(
      validateCommentDraft({
        articleId: "post:20180301-algorithm-js-misc-1",
        visitorId: "visitor_1234567890abcdef",
        author: "读者",
        body: "写得很清楚。"
      })
    ).toMatchObject({
      author: "读者",
      body: "写得很清楚。"
    });
  });

  it("rejects unsafe or incomplete drafts", () => {
    expect(() => normalizeArticleId("../secret")).toThrow("文章标识不合法");
    expect(() => normalizeArticleId("2018/03/12/Zero-Shot Learning")).toThrow("文章标识不合法");
    expect(() =>
      validateCommentDraft({
        articleId: "post:20180301-algorithm-js-misc-1",
        visitorId: "short",
        author: "",
        body: "x"
      })
    ).toThrow();
  });

  it("rejects comments that exceed the public input limits", () => {
    expect(() =>
      validateCommentDraft({
        articleId: "post:20180301-algorithm-js-misc-1",
        visitorId: "visitor_1234567890abcdef",
        author: "读".repeat(AUTHOR_MAX_LENGTH + 1),
        body: "评论内容"
      })
    ).toThrow("昵称最多 10 个字");

    expect(() =>
      validateCommentDraft({
        articleId: "post:20180301-algorithm-js-misc-1",
        visitorId: "visitor_1234567890abcdef",
        author: "读者",
        body: "评".repeat(COMMENT_MAX_LENGTH + 1)
      })
    ).toThrow("评论最多 100 个字");
  });
});
