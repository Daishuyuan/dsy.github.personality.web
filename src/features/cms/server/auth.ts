import { timingSafeEqual } from "node:crypto";
import type { ApiRequestLike } from "./apiResponse.ts";
import { CmsApiError, header } from "./apiResponse.ts";
import { getCmsEnv } from "./env.ts";

export function requireOwner(req: ApiRequestLike): string {
  const configured = getCmsEnv().adminToken;
  if (!configured) {
    throw new CmsApiError("AUTH_REQUIRED", "未配置管理访问令牌。", 401);
  }
  const authorization = header(req, "authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!safeEqual(token, configured)) {
    throw new CmsApiError("AUTH_REQUIRED", "需要管理权限。", 401);
  }
  return "owner";
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
