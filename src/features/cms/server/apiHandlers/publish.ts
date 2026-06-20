import { parseArticleId, versionActionSchema } from "../../validation.ts";
import { publishArticle } from "../articleService.ts";
import { requireOwner } from "../auth.ts";
import { first, methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = requireOwner(req);
    if (req.method !== "POST") {
      methodNotAllowed(res);
      return;
    }
    const articleId = parseArticleId(first(req.query?.articleId));
    const body = versionActionSchema.parse(await readJsonBody(req));
    sendSuccess(res, await publishArticle(articleId, body.expectedVersion, actor));
  } catch (error) {
    sendError(res, error);
  }
}
