import { describe, expect, it } from "vitest";
import { legacyPathFromTitle, withDerivedPublishFields, withSaveExpectedVersion } from "../admin/publishFields";

describe("CMS admin publish fields", () => {
  it("derives the legacy path from the publish date and title", () => {
    expect(legacyPathFromTitle("算法探究(C)之大杂烩(1)", "2018-02-28")).toBe("/2018/02/28/算法探究(C)之大杂烩(1)/");
    expect(legacyPathFromTitle("算法探究(C)之大杂烩(1)", "2018-02-28T13:45:09.000Z")).toBe(
      "/2018/02/28/算法探究(C)之大杂烩(1)/"
    );
  });

  it("keeps the date but replaces the editable path with the title-derived path before saving", () => {
    expect(
      withDerivedPublishFields({
        title: "Zero-Shot Learning(the state of art)",
        publishedDate: "2018-03-12",
        legacyPath: "/custom/path/"
      })
    ).toMatchObject({
      title: "Zero-Shot Learning(the state of art)",
      publishedDate: "2018-03-12",
      legacyPath: "/2018/03/12/Zero-Shot Learning(the state of art)/"
    });
  });

  it("sends expectedVersion when saving an existing article", () => {
    expect(
      withSaveExpectedVersion({
        articleId: "post:test",
        version: 4,
        title: "Test",
        publishedDate: "2026-06-21"
      })
    ).toMatchObject({
      articleId: "post:test",
      version: 4,
      expectedVersion: 4,
      legacyPath: "/2026/06/21/Test/"
    });
  });

  it("does not send expectedVersion for new articles", () => {
    expect(withSaveExpectedVersion({ title: "New", publishedDate: "2026-06-21" })).not.toHaveProperty("expectedVersion");
  });
});
