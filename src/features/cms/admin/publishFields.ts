import type { Article } from "../types";

export function withDerivedPublishFields(article: Partial<Article>): Partial<Article> {
  const publishedDate = article.publishedDate || todayDate();
  const title = article.title || "New Note";
  return {
    ...article,
    publishedDate,
    legacyPath: legacyPathFromTitle(title, publishedDate)
  };
}

export function legacyPathFromTitle(title: string, publishedDate?: string): string {
  const date = normalizeDate(publishedDate);
  return `/${date.replaceAll("-", "/")}/${titlePathSegment(title)}/`;
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value?: string): string {
  const date = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayDate();
}

function titlePathSegment(title: string): string {
  return (
    title
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\/+/g, "-") || "untitled"
  );
}
