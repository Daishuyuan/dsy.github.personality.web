import { verificationRunSchema } from "../../validation.ts";
import { runCriticalVerification } from "../verificationService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-verification`, 20, 60_000);
    if (req.method !== "POST") {
      methodNotAllowed(res);
      return;
    }
    const body = verificationRunSchema.parse(await readJsonBody(req));
    sendSuccess(res, await runCriticalVerification(body, actor), 201);
  } catch (error) {
    sendError(res, error);
  }
}
