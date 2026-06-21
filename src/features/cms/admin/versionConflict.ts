import type { Article } from "../types";
import { AdminRequestError } from "./adminClient";
import type { ArticleSaveDraft } from "./publishFields";

const versionConflictMessage = "文章版本已变化";

export function isVersionConflictError(error: unknown): boolean {
  return (
    error instanceof AdminRequestError &&
    (error.status === 409 || error.code === "CONFLICT" || error.message.includes(versionConflictMessage))
  );
}

export function rebaseDraftOnLatestVersion(draft: ArticleSaveDraft, latest: Article): ArticleSaveDraft {
  return {
    ...latest,
    title: draft.title ?? latest.title,
    publishedDate: draft.publishedDate ?? latest.publishedDate,
    legacyPath: draft.legacyPath ?? latest.legacyPath,
    tags: draft.tags ?? latest.tags,
    toc: draft.toc ?? latest.toc,
    status: draft.status ?? latest.status,
    markdown: draft.markdown ?? latest.markdown,
    expectedVersion: latest.version
  };
}
