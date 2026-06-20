import { CmsDatabaseUnavailableError } from "../cms/server/mongo.ts";
import { findDynamicArticleByPath, getDynamicArticles } from "./dynamicSource.ts";
import type { ContentSourceMode, PublicArticle } from "./types.ts";

export function getContentSourceMode(): ContentSourceMode {
  return "database";
}

export async function getPublicArticles(): Promise<PublicArticle[]> {
  try {
    return await getDynamicArticles();
  } catch (error) {
    throw toPublicContentSourceError(error);
  }
}

export async function findPublicArticleByPath(path: string): Promise<PublicArticle | null> {
  try {
    return await findDynamicArticleByPath(path);
  } catch (error) {
    throw toPublicContentSourceError(error);
  }
}

export function getPublicCacheHeaders(): Record<string, string> {
  return {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
  };
}

export class PublicContentSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicContentSourceError";
  }
}

export function getPublicContentErrorMessage(error: unknown): string {
  if (error instanceof PublicContentSourceError) {
    return error.message;
  }
  if (error instanceof CmsDatabaseUnavailableError) {
    return error.message;
  }
  return "数据库读取失败，文章无法加载。";
}

function toPublicContentSourceError(error: unknown): PublicContentSourceError {
  return new PublicContentSourceError(getPublicContentErrorMessage(error));
}
