import { describe, expect, it } from "vitest";
import { legacyPathFromTitle, withDerivedPublishFields } from "../admin/publishFields";

describe("CMS derived publish fields", () => {
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
});
