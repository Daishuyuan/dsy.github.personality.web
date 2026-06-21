import { beforeEach, describe, expect, it } from "vitest";
import { runCriticalVerification } from "../server/verificationService";
import { saveArticleDraft } from "../server/articleService";
import { resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("verification service", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("fails required checks when no published content exists", async () => {
    const run = await runCriticalVerification({ scope: "cms-critical", includePublicRead: true, includeEngagementIdentity: true });

    expect(run.status).toBe("failed");
    expect(run.steps.some((step) => step.status === "failed" || step.status === "blocked")).toBe(true);
  });

  it("reports step-level output for critical checks", async () => {
    await saveArticleDraft(sampleArticleDraft({ status: "published" }));

    const run = await runCriticalVerification({ scope: "cms-critical", includePublicRead: true, includeEngagementIdentity: true });

    expect(run.steps.map((step) => step.stepId)).toContain("public-article-load");
    expect(run.steps.map((step) => step.stepId)).toContain("engagement-identity");
  });
});
