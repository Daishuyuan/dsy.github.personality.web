import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { ApiRequestLike } from "./apiResponse.ts";
import { CmsApiError, header } from "./apiResponse.ts";
import { getCmsEnv } from "./env.ts";

export async function requireOwner(req: ApiRequestLike): Promise<string> {
  const token = bearerToken(req);
  if (!token) {
    throw new CmsApiError("AUTH_REQUIRED", "请先使用 Google 账号登录。", 401);
  }

  const actor = await requireSupabaseOwner(token);
  if (actor) {
    return actor;
  }

  return requireFallbackOwner(token);
}

async function requireSupabaseOwner(token: string): Promise<string | null> {
  const env = getCmsEnv();
  if (!env.publicSupabaseUrl || !env.publicSupabaseAnonKey) {
    return null;
  }
  if (env.ownerEmails.length === 0) {
    throw new CmsApiError("FORBIDDEN", "未配置管理员邮箱白名单。", 403);
  }

  const { data, error } = await createClient(env.publicSupabaseUrl, env.publicSupabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  }).auth.getUser(token);

  if (error || !data.user?.email) {
    throw new CmsApiError("AUTH_REQUIRED", "Google 登录已失效，请重新登录。", 401);
  }

  const email = data.user.email.toLowerCase();
  if (!env.ownerEmails.includes(email)) {
    throw new CmsApiError("FORBIDDEN", "当前 Google 账号没有文章管理权限。", 403);
  }

  return email;
}

function requireFallbackOwner(token: string): string {
  if (process.env.NODE_ENV === "production") {
    throw new CmsApiError("AUTH_REQUIRED", "生产环境必须使用 Google 登录。", 401);
  }
  const configured = getCmsEnv().adminToken;
  if (!configured) {
    throw new CmsApiError("AUTH_REQUIRED", "未配置管理登录方式。", 401);
  }
  if (!safeEqual(token, configured)) {
    throw new CmsApiError("AUTH_REQUIRED", "需要管理权限。", 401);
  }
  return "owner";
}

function bearerToken(req: ApiRequestLike): string {
  const authorization = header(req, "authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
