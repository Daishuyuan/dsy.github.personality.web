import { CmsDatabaseUnavailableError } from "./mongo.ts";

export interface ApiRequestLike {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponseLike {
  status: (code: number) => ApiResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export type CmsErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "UNSAFE_CONTENT"
  | "DUPLICATE_PATH"
  | "RESERVED_PATH"
  | "CONFLICT"
  | "NOT_FOUND"
  | "UPLOAD_REJECTED"
  | "STORAGE_FAILURE"
  | "CONTENT_SOURCE_UNAVAILABLE";

export class CmsApiError extends Error {
  readonly code: CmsErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: CmsErrorCode,
    message: string,
    statusCode = statusForCode(code),
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function sendSuccess(res: ApiResponseLike, data: unknown, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendError(res: ApiResponseLike, error: unknown): void {
  const apiError = toApiError(error);
  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {})
    }
  });
}

export async function readJsonBody(req: ApiRequestLike): Promise<Record<string, unknown>> {
  if (typeof req.body === "string") {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  return {};
}

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function header(req: ApiRequestLike, name: string): string | undefined {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return first(value);
}

export function methodNotAllowed(res: ApiResponseLike): void {
  res.status(405).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Method not allowed." } });
}

export function toApiError(error: unknown): CmsApiError {
  if (error instanceof CmsApiError) {
    return error;
  }
  if (error instanceof CmsDatabaseUnavailableError) {
    return new CmsApiError("CONTENT_SOURCE_UNAVAILABLE", error.message);
  }
  if (error instanceof Error) {
    if (error.message === "文章版本已变化，请刷新后重试。") {
      return new CmsApiError("CONFLICT", error.message);
    }
    if (error.message === "RESERVED_PATH") {
      return new CmsApiError("RESERVED_PATH", "文章路径不允许使用。");
    }
    if (error.name === "ZodError") {
      return new CmsApiError("VALIDATION_ERROR", "请求参数不合法。");
    }
    return new CmsApiError("VALIDATION_ERROR", error.message || "请求失败。");
  }
  return new CmsApiError("VALIDATION_ERROR", "请求失败。");
}

function statusForCode(code: CmsErrorCode): number {
  switch (code) {
    case "AUTH_REQUIRED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
    case "DUPLICATE_PATH":
    case "RESERVED_PATH":
      return 409;
    case "STORAGE_FAILURE":
      return 502;
    case "CONTENT_SOURCE_UNAVAILABLE":
      return 503;
    default:
      return 400;
  }
}
