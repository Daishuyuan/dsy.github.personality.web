import { healthRunSchema, operationsSummaryQuerySchema } from "../../validation.ts";
import { getOperationsSummary } from "../operationsService.ts";
import { runContentHealthCheck } from "../healthReportService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, readJsonBody, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";
import { enforceRateLimit, getClientKey } from "../requestSafety.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    enforceRateLimit(`${getClientKey(req)}:cms-operations`, 60, 60_000);

    if (req.method === "GET") {
      const query = operationsSummaryQuerySchema.parse(req.query ?? {});
      sendSuccess(res, await getOperationsSummary(query.includeIssues));
      return;
    }

    if (req.method === "POST") {
      const body = healthRunSchema.parse(await readJsonBody(req));
      sendSuccess(res, await runContentHealthCheck(body, actor), 201);
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendError(res, error);
  }
}
