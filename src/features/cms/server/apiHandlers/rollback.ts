import { parseArticleId, rollbackSchema } from "../../validation.ts";
import { rollbackArticle } from "../rollbackService.ts";
import { requireOwner } from "../auth.ts";
import { first, methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    if (req.method !== "POST") {
      methodNotAllowed(res);
      return;
    }
    const articleId = parseArticleId(first(req.query?.articleId));
    const body = rollbackSchema.parse(await readJsonBody(req));
    sendSuccess(res, await rollbackArticle(articleId, body.versionId, body.expectedVersion, actor));
  } catch (error) {
    sendError(res, error);
  }
}
