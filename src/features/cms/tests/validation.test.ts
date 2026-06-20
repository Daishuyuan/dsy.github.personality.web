import { describe, expect, it } from "vitest";
import { normalizeLegacyPath, parseArticleDraft } from "../validation";
import { sampleArticleDraft } from "./fixtures";

describe("CMS validation", () => {
  it("normalizes safe article paths", () => {
    expect(normalizeLegacyPath("2026/06/20/test")).toBe("/2026/06/20/test/");
  });

  it("rejects reserved admin paths", () => {
    expect(() => parseArticleDraft(sampleArticleDraft({ legacyPath: "/admin/test/" }))).toThrow();
  });

  it("deduplicates tags", () => {
    expect(parseArticleDraft(sampleArticleDraft({ tags: ["A", "A", "B"] })).tags).toEqual(["A", "B"]);
  });
});
