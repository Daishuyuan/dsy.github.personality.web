import type { PublicArticle } from "./types.ts";
import { findPublishedByPath, listPublishedArticles } from "../cms/server/articleRepository.ts";

export async function getDynamicArticles(): Promise<PublicArticle[]> {
  return listPublishedArticles();
}

export async function findDynamicArticleByPath(path: string): Promise<PublicArticle | null> {
  return findPublishedByPath(path);
}
