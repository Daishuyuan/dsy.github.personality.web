import type { CommentDraft } from "./types";

export const AUTHOR_MAX_LENGTH = 10;
export const COMMENT_MAX_LENGTH = 100;

export interface ValidatedCommentDraft {
  articleId: string;
  visitorId: string;
  author: string;
  body: string;
}

export function normalizeArticleId(value: unknown) {
  const articleId = String(value ?? "").trim();

  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9:_-]{1,119}$/.test(articleId) ||
    articleId.includes("..") ||
    articleId.length < 2 ||
    articleId.length > 120
  ) {
    throw new Error("文章标识不合法。");
  }

  return articleId;
}

export function normalizeVisitorId(value: unknown) {
  const visitorId = String(value ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(visitorId)) {
    throw new Error("访客标识不合法。");
  }
  return visitorId;
}

export function validateCommentDraft(input: Partial<CommentDraft>): ValidatedCommentDraft {
  const articleId = normalizeArticleId(input.articleId);
  const visitorId = normalizeVisitorId(input.visitorId);
  const author = cleanText(input.author);
  const body = cleanText(input.body);

  if (author.length < 1) {
    throw new Error("昵称不能为空。");
  }

  assertMaxCharacters(author, AUTHOR_MAX_LENGTH, "昵称");

  if (body.length < 2) {
    throw new Error("评论至少需要 2 个字符。");
  }

  assertMaxCharacters(body, COMMENT_MAX_LENGTH, "评论");

  return {
    articleId,
    visitorId,
    author,
    body
  };
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function assertMaxCharacters(value: string, maxLength: number, label: string) {
  if (Array.from(value).length > maxLength) {
    throw new Error(`${label}最多 ${maxLength} 个字。`);
  }
}
