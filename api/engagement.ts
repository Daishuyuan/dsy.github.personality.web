import {
  createComment,
  getEngagementSnapshot,
  toggleLike
} from "../src/features/engagement/server/store";
import { normalizeArticleId, normalizeVisitorId, validateCommentDraft } from "../src/features/engagement/validation";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const articleId = normalizeArticleId(first(req.query?.articleId));
      const visitorId = normalizeVisitorId(header(req, "x-visitor-id") ?? first(req.query?.visitorId));
      res.status(200).json(await getEngagementSnapshot(articleId, visitorId));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const action = String(body.action ?? "");

      if (action === "like") {
        const articleId = normalizeArticleId(body.articleId);
        const visitorId = normalizeVisitorId(body.visitorId);
        res.status(200).json(await toggleLike(articleId, visitorId));
        return;
      }

      if (action === "comment") {
        const comment = await createComment(validateCommentDraft(body));
        res.status(201).json({ comment });
        return;
      }

      throw new Error("未知互动操作。");
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "请求失败。" });
  }
}

async function readBody(req: ApiRequest) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function header(req: ApiRequest, name: string) {
  const lower = name.toLowerCase();
  const value = req.headers?.[lower] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}
