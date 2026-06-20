import { parseArticleId } from "../../validation.ts";
import { listArticleVersions } from "../versionRepository.ts";
import { requireOwner } from "../auth.ts";
import { first, methodNotAllowed, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await requireOwner(req);
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return;
    }
    const articleId = parseArticleId(first(req.query?.articleId));
    const versions = await listArticleVersions(articleId);
    sendSuccess(res, { items: versions, page: 1, pageSize: 30 });
  } catch (error) {
    sendError(res, error);
  }
}
