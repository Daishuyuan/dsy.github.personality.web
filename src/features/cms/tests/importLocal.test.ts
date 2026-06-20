import { beforeEach, describe, expect, it } from "vitest";
import { CmsDatabaseUnavailableError } from "../server/mongo.ts";
import { importLocalArticles } from "../server/importLocalService.ts";
import { getCmsMemoryStore } from "../server/memoryStore.ts";
import { resetCmsMemoryStore } from "./fixtures";

describe("local import service", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("dry-runs the current local corpus without writing articles", async () => {
    const report = await importLocalArticles(process.cwd(), "dry-run");
    expect(report.passed).toBe(true);
    expect(report.localArticleCount).toBe(11);
    expect(report.duplicatePaths).toHaveLength(0);
    expect(getCmsMemoryStore().articles).toHaveLength(0);
  });

  it("requires a configured database before applying imports", async () => {
    await expect(importLocalArticles(process.cwd(), "apply")).rejects.toBeInstanceOf(CmsDatabaseUnavailableError);
    expect(getCmsMemoryStore().articles).toHaveLength(0);
  });
});
