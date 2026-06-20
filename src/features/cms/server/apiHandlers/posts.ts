import { paginationSchema } from "../../validation.ts";
import { listOwnerArticles } from "../articleRepository.ts";
import { saveArticleDraft } from "../articleService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey, withIdempotency } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-posts`, 120, 60_000);

    if (req.method === "GET") {
      const query = paginationSchema.parse(req.query ?? {});
      sendSuccess(res, await listOwnerArticles(query));
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const article = await withIdempotency(req, body, () => saveArticleDraft(body, actor));
      sendSuccess(res, article, 201);
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendError(res, error);
  }
}
