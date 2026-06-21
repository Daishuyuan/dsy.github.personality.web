import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Article, ImageAsset } from "../types";

export interface AdminAuthState {
  ready: boolean;
  mode: "oauth" | "fallback" | "unconfigured";
  email?: string;
  token?: string;
  message?: string;
}

let supabaseClient: SupabaseClient | null | undefined;

export function getStoredToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.sessionStorage.getItem("cms_admin_token") ?? "";
}

export function storeToken(token: string): void {
  window.sessionStorage.setItem("cms_admin_token", token);
}

export function clearStoredToken(): void {
  window.sessionStorage.removeItem("cms_admin_token");
}

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (supabaseClient !== undefined) {
    return supabaseClient;
  }

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "");
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "");
  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return supabaseClient;
}

export async function getAdminAuthState(): Promise<AdminAuthState> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ready: false, mode: "oauth", message: error.message || "Google 登录状态读取失败。" };
    }
    if (data.session?.access_token) {
      return {
        ready: true,
        mode: "oauth",
        token: data.session.access_token,
        email: data.session.user.email ?? undefined
      };
    }
    return { ready: false, mode: "oauth" };
  }

  const token = getStoredToken();
  if (token) {
    return { ready: true, mode: "fallback", token };
  }
  return {
    ready: false,
    mode: import.meta.env.DEV ? "fallback" : "unconfigured",
    message: import.meta.env.DEV ? undefined : "未配置 Google 登录。"
  };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("未配置 Google 登录。");
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/admin/`
    }
  });
  if (error) {
    throw new Error(error.message || "Google 登录失败。");
  }
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  clearStoredToken();
}

export async function verifyAdminAccess(token: string): Promise<void> {
  const response = await fetch("/api/cms/health", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new AdminRequestError(payload.error?.message ?? "管理权限验证失败。", response.status, payload.error?.code);
  }
}

async function getAuthToken(): Promise<string> {
  const state = await getAdminAuthState();
  if (state.token) {
    return state.token;
  }
  throw new AdminRequestError(state.message ?? "请先登录。", 401, "AUTH_REQUIRED");
}

export class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "AdminRequestError";
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new AdminRequestError(payload.error?.message ?? "请求失败。", response.status, payload.error?.code);
  }
  return payload.data as T;
}

export function emptyArticle(): Partial<Article> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    legacyPath: `/${today.replaceAll("-", "/")}/new-note/`,
    title: "New Note",
    publishedDate: today,
    tags: ["Notes"],
    toc: true,
    status: "draft",
    markdown: "# New Note\n\n"
  };
}

export async function fileToUploadPayload(file: File, articleId?: string) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
  return {
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    dataBase64: dataUrl.split(",")[1] ?? "",
    articleId
  };
}

export type UploadedAsset = ImageAsset;
