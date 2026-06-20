import { createContentExport } from "../exportService.ts";
import { requireOwner } from "../auth.ts";
import { methodNotAllowed, sendError, type ApiRequestLike, type ApiResponseLike } from "../apiResponse.ts";

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const actor = await requireOwner(req);
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return;
    }
    const archive = await createContentExport(actor);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${archive.manifest.exportId}.json"`);
    res.status(200).json(archive);
  } catch (error) {
    sendError(res, error);
  }
}
