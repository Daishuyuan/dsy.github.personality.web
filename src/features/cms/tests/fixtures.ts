import { getCmsMemoryStore } from "../server/memoryStore";
import type { ApiResponseLike } from "../server/apiResponse";

export function resetCmsMemoryStore() {
  const store = getCmsMemoryStore();
  store.articles.length = 0;
  store.versions.length = 0;
  store.assets.length = 0;
  store.auditEvents.length = 0;
  store.exports.length = 0;
  store.migrationReports.length = 0;
  store.healthReports.length = 0;
  store.verificationRuns.length = 0;
}

export function sampleArticleDraft(overrides: Record<string, unknown> = {}) {
  return {
    legacyPath: "/2026/06/20/test-note/",
    title: "Test Note",
    publishedDate: "2026-06-20",
    tags: ["Test"],
    toc: true,
    status: "draft",
    markdown: "# Test Note\n\nBody.",
    ...overrides
  };
}

export function createApiResponse() {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    }
  };
  return res satisfies ApiResponseLike & { statusCode: number; body: unknown; headers: Record<string, string> };
}

export function ownerHeaders() {
  return { authorization: "Bearer test-admin-token" };
}
