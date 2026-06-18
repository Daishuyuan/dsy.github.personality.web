import { expect, test } from "@playwright/test";

test("article page renders like toggles and immediate comments", async ({ page }) => {
  let likes = 3;
  let liked = false;
  const comments = [
    {
      id: "approved-1",
      articleId: "post:20180301-algorithm-js-misc-1",
      author: "Daishuyuan",
      body: "公开评论。",
      status: "approved",
      createdAt: new Date().toISOString()
    }
  ];

  await page.route("**/api/engagement**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      expect(new URL(request.url()).searchParams.get("articleId")).toBe("post:20180301-algorithm-js-misc-1");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          articleId: "post:20180301-algorithm-js-misc-1",
          likes,
          liked,
          mode: "memory",
          comments
        })
      });
      return;
    }

    const payload = request.postDataJSON();
    expect(payload.articleId).toBe("post:20180301-algorithm-js-misc-1");
    if (payload.action === "like") {
      liked = !liked;
      likes += liked ? 1 : -1;
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ liked, likes }) });
      return;
    }

    if (payload.action === "comment") {
      const comment = {
        id: "approved-2",
        articleId: payload.articleId,
        author: payload.author,
        body: payload.body,
        status: "approved",
        createdAt: new Date().toISOString()
      };
      comments.unshift(comment);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ comment }) });
      return;
    }

    await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "bad action" }) });
  });

  await page.goto("/2018/03/01/算法探究(Javascript)之大杂烩(1)/");
  await expect(page.getByRole("heading", { name: "评论与点赞" })).toBeVisible();
  await expect(page.getByText("当前是本地演示模式")).toHaveCount(0);
  await expect(page.getByLabel("邮箱")).toHaveCount(0);
  await expect(page.getByLabel("网站")).toHaveCount(0);
  await expect(page.locator(".comment-list")).toContainText("公开评论。");

  await page.getByRole("button", { name: "点赞，当前 3" }).click();
  await expect(page.getByRole("button", { name: "取消点赞，当前 4" })).toBeVisible();
  await page.getByRole("button", { name: "取消点赞，当前 4" }).click();
  await expect(page.getByRole("button", { name: "点赞，当前 3" })).toBeVisible();

  const authorInput = page.getByLabel("昵称");
  const commentInput = page.getByRole("textbox", { name: "评论" });

  await authorInput.fill("abcdefghijkl");
  await expect(authorInput).toHaveValue("abcdefghij");
  await commentInput.fill("x".repeat(120));
  await expect(commentInput).toHaveValue("x".repeat(100));

  await authorInput.fill("读者");
  await commentInput.fill("这是一条公开评论。");
  await page.getByRole("button", { name: "发表评论" }).click();
  await expect(page.locator(".comment-list")).toContainText("这是一条公开评论。");
  await expect(page.getByText("待审核")).toHaveCount(0);
});
