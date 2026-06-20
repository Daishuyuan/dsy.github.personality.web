import { beforeEach, describe, expect, it } from "vitest";
import { saveArticleDraft } from "../server/articleService";
import { createContentExport } from "../server/exportService";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("export service", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("exports articles and manifest hashes", async () => {
    await saveArticleDraft(sampleArticleDraft());
    const archive = await createContentExport();
    expect(archive.manifest.articleCount).toBe(1);
    expect(archive.manifest.contentHash).toMatch(/^sha256:/);
  });
});
