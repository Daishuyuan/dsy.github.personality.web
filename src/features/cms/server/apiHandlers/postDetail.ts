import { parseArticleId } from "../../validation.ts";
import { findArticleById } from "../articleRepository.ts";
import { saveArticleDraft } from "../articleService.ts";
import { requireOwner } from "../auth.ts";
import { CmsApiError, first, methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey, withIdempotency } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-post`, 120, 60_000);
    const articleId = parseArticleId(first(req.query?.articleId));

    if (req.method === "GET") {
      const article = await findArticleById(articleId);
      if (!article) {
        throw new CmsApiError("NOT_FOUND", "文章不存在。", 404);
      }
      sendSuccess(res, article);
      return;
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const article = await withIdempotency(req, body, () => saveArticleDraft({ ...body, articleId }, actor));
      sendSuccess(res, article);
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendError(res, error);
  }
}
