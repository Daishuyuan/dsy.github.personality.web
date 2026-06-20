import { uploadImage } from "../assetService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-assets`, 30, 60_000);
    if (req.method !== "POST") {
      methodNotAllowed(res);
      return;
    }
    const body = await readJsonBody(req);
    sendSuccess(res, await uploadImage(body as any, actor), 201);
  } catch (error) {
    sendError(res, error);
  }
}
