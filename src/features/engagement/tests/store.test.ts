import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createComment, getEngagementSnapshot, toggleLike } from "../server/store";
import { validateCommentDraft } from "../validation";

const articleId = `post:test-${Date.now()}`;
const visitorId = "visitor_1234567890abcdef";
const storePath = join(process.cwd(), `.tmp-engagement-store-${process.pid}.json`);

beforeEach(async () => {
  process.env.ENGAGEMENT_LOCAL_STORE_PATH = storePath;
  await rm(storePath, { force: true });
});

afterAll(async () => {
  await rm(storePath, { force: true });
});

describe("engagement memory store", () => {
  it("toggles anonymous likes and returns visitor-specific state", async () => {
    const liked = await toggleLike(articleId, visitorId);
    expect(liked).toEqual({ liked: true, likes: 1 });

    const snapshot = await getEngagementSnapshot(articleId, visitorId);
    expect(snapshot).toMatchObject({ likes: 1, liked: true, mode: "memory" });

    const unliked = await toggleLike(articleId, visitorId);
    expect(unliked).toEqual({ liked: false, likes: 0 });
  });

  it("publishes anonymous comments immediately", async () => {
    const comment = await createComment(
      validateCommentDraft({
        articleId,
        visitorId,
        author: "读者",
        body: "首版评论模块测试。"
      })
    );
    expect(comment.status).toBe("approved");

    const snapshot = await getEngagementSnapshot(articleId, visitorId);
    expect(snapshot.comments[0]).toMatchObject({ author: "读者", status: "approved" });
  });

  it("migrates legacy slug data in the local store", async () => {
    await writeFile(
      storePath,
      JSON.stringify({
        comments: [
          {
            id: "legacy-comment",
            slug: "2018/03/01/算法探究(Javascript)之大杂烩(1)",
            author: "旧读者",
            body: "旧评论。",
            status: "approved",
            createdAt: new Date().toISOString(),
            visitorHash: "legacy"
          }
        ],
        likes: ["2018/03/01/算法探究(Javascript)之大杂烩(1):legacy"]
      })
    );

    const snapshot = await getEngagementSnapshot("post:20180301-algorithm-js-misc-1", visitorId);
    expect(snapshot.likes).toBe(1);
    expect(snapshot.comments[0]).toMatchObject({
      articleId: "post:20180301-algorithm-js-misc-1",
      author: "旧读者"
    });

    const serialized = await readFile(storePath, "utf8");
    expect(serialized).not.toContain("\"slug\"");
    expect(serialized).toContain("post:20180301-algorithm-js-misc-1");
  });
});
