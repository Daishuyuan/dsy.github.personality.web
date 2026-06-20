import { getCmsMemoryStore } from "../server/memoryStore";

export function resetCmsMemoryStore() {
  const store = getCmsMemoryStore();
  store.articles.length = 0;
  store.versions.length = 0;
  store.assets.length = 0;
  store.auditEvents.length = 0;
  store.exports.length = 0;
  store.migrationReports.length = 0;
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
