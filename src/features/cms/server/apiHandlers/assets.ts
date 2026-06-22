import { assetDeleteQuerySchema, assetListQuerySchema } from "../../validation.ts";
import { deleteUnusedImageAsset, listImageLibrary } from "../assetService.ts";
import { uploadImage } from "../assetService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-assets`, 30, 60_000);
    if (req.method === "GET") {
      const query = assetListQuerySchema.parse(req.query ?? {});
      sendSuccess(res, await listImageLibrary(query));
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      sendSuccess(res, await uploadImage(body as any, actor), 201);
      return;
    }

    if (req.method === "DELETE") {
      const query = assetDeleteQuerySchema.parse(req.query ?? {});
      sendSuccess(res, await deleteUnusedImageAsset(query.assetId, actor));
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendError(res, error);
  }
}
