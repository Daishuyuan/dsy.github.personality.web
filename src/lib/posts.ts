import type { PublicArticle } from "../features/content/types";

export type BlogPost = PublicArticle;

const collator = new Intl.Collator("zh-CN");

export function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

export function formatDate(date: Date | string) {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

export function getPostSlug(post: BlogPost) {
  const pathParts = post.legacyPath.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1] ?? post.articleId;
}

export function getPostPath(post: BlogPost) {
  return post.legacyPath;
}

export function getPostArticleId(post: BlogPost) {
  return post.articleId;
}

export function getAllTags(posts: BlogPost[]) {
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) => collator.compare(a, b));
}

export function getArchiveGroups(posts: BlogPost[]) {
  const groups = new Map<string, BlogPost[]>();

  for (const post of sortPosts(posts)) {
    const date = new Date(post.publishedDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }

  return Array.from(groups.entries());
}
