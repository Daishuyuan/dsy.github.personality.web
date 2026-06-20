import type { APIContext, APIRoute } from "astro";
import type { ApiRequestLike, ApiResponseLike } from "./apiResponse.ts";

type CmsApiHandler = (req: ApiRequestLike, res: ApiResponseLike) => Promise<void> | void;

export function createAstroApiRoute(handler: CmsApiHandler): APIRoute {
  return async (context: APIContext) => {
    const responseHeaders = new Headers();
    let statusCode = 200;
    let payload: unknown = null;

    const res: ApiResponseLike = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(body: unknown) {
        payload = body;
      },
      setHeader(name: string, value: string) {
        responseHeaders.set(name, value);
      }
    };

    await handler(await toApiRequest(context), res);

    if (!responseHeaders.has("Content-Type")) {
      responseHeaders.set("Content-Type", "application/json; charset=utf-8");
    }
    return new Response(JSON.stringify(payload), {
      status: statusCode,
      headers: responseHeaders
    });
  };
}

async function toApiRequest(context: APIContext): Promise<ApiRequestLike> {
  return {
    method: context.request.method,
    headers: toHeaderRecord(context.request.headers),
    query: toQueryRecord(context),
    body: await readRequestBody(context.request)
  };
}

function toHeaderRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

function toQueryRecord(context: APIContext): Record<string, string | string[]> {
  const url = new URL(context.request.url);
  const query: Record<string, string | string[]> = {};
  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0] ?? "";
  }
  return { ...query, ...context.params };
}

async function readRequestBody(request: Request): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }
  const text = await request.text();
  return text;
}
