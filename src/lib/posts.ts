import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

const collator = new Intl.Collator("zh-CN");

export function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getPostSlug(post: BlogPost) {
  const pathParts = post.data.legacyPath.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1] ?? post.id.replace(/\.md$/, "");
}

export function getPostPath(post: BlogPost) {
  return post.data.legacyPath;
}

export function getAllTags(posts: BlogPost[]) {
  return Array.from(new Set(posts.flatMap((post) => post.data.tags))).sort((a, b) =>
    collator.compare(a, b)
  );
}

export function getArchiveGroups(posts: BlogPost[]) {
  const groups = new Map<string, BlogPost[]>();

  for (const post of sortPosts(posts)) {
    const key = `${post.data.date.getFullYear()}-${String(post.data.date.getMonth() + 1).padStart(2, "0")}`;
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }

  return Array.from(groups.entries());
}
