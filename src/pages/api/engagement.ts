import type { APIRoute } from "astro";
import { createComment, getEngagementSnapshot, toggleLike } from "../../features/engagement/server/store.ts";
import { normalizeArticleId, normalizeVisitorId, validateCommentDraft } from "../../features/engagement/validation.ts";

export const ALL: APIRoute = async ({ request }) => {
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const articleId = normalizeArticleId(url.searchParams.get("articleId"));
      const visitorId = normalizeVisitorId(request.headers.get("x-visitor-id") ?? url.searchParams.get("visitorId"));
      return json(await getEngagementSnapshot(articleId, visitorId));
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const action = String(body.action ?? "");

      if (action === "like") {
        const articleId = normalizeArticleId(body.articleId);
        const visitorId = normalizeVisitorId(body.visitorId);
        return json(await toggleLike(articleId, visitorId));
      }

      if (action === "comment") {
        const comment = await createComment(validateCommentDraft(body));
        return json({ comment }, 201);
      }

      throw new Error("未知互动操作。");
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "请求失败。" }, 400);
  }
};

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  return text.trim() ? (JSON.parse(text) as Record<string, unknown>) : {};
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
