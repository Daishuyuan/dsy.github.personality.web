import { beforeEach, describe, expect, it } from "vitest";
import { verifyMigration } from "../server/migrationVerificationService.ts";
import { resetCmsMemoryStore } from "./fixtures";

describe("migration verification service", () => {
  beforeEach(() => {
    resetCmsMemoryStore();
  });

  it("reports missing dynamic articles when the database has not been populated", async () => {
    const report = await verifyMigration(process.cwd());
    expect(report.passed).toBe(false);
    expect(report.localArticleCount).toBe(11);
    expect(report.dynamicArticleCount).toBe(0);
    expect(report.missingArticleIds).toHaveLength(11);
    expect(report.changedArticleIds).toHaveLength(0);
  });
});
