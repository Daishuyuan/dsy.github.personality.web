import { auditListQuerySchema } from "../../validation.ts";
import { listActivityRecords } from "../operationsService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-audit`, 120, 60_000);
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return;
    }
    const query = auditListQuerySchema.parse(req.query ?? {});
    sendSuccess(res, await listActivityRecords(query));
  } catch (error) {
    sendError(res, error);
  }
}
