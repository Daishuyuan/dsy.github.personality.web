import type { Article, ImageAsset } from "../types";

export interface AdminState {
  token: string;
}

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
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
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
