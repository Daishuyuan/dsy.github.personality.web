import { getCmsEnv } from "../env.ts";
import { getCmsDatabase } from "../mongo.ts";
import { getSupabaseStorageClient } from "../storageClient.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, sendError, sendSuccess, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await requireOwner(req);
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return;
    }
    sendSuccess(res, {
      contentSource: "database",
      database: (await getCmsDatabase()) ? "ok" : "missing-config",
      storage: getSupabaseStorageClient() ? "ok" : "memory"
    });
  } catch (error) {
    sendError(res, error);
  }
}
