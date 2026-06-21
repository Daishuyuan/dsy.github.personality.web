import { beforeEach, describe, expect, it, vi } from "vitest";
import operationsHandler from "../server/apiHandlers/operations";
import { saveArticleDraft } from "../server/articleService";
import { createApiResponse, ownerHeaders, resetCmsMemoryStore, sampleArticleDraft } from "./fixtures";

describe("operations API", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_TOKEN", "test-admin-token");
    resetCmsMemoryStore();
  });

  it("denies anonymous access", async () => {
    const res = createApiResponse();
    await operationsHandler({ method: "GET", headers: {} }, res);

    expect(res.statusCode).toBe(401);
  });

  it("returns summary and runs health check for the owner", async () => {
    await saveArticleDraft(sampleArticleDraft({ status: "published" }));
    const summaryRes = createApiResponse();
    await operationsHandler({ method: "GET", headers: ownerHeaders(), query: { includeIssues: "true" } }, summaryRes);

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body).toMatchObject({ success: true, data: { content: { articleCount: 1 } } });

    const healthRes = createApiResponse();
    await operationsHandler({ method: "POST", headers: ownerHeaders(), body: {} }, healthRes);

    expect(healthRes.statusCode).toBe(201);
    expect(healthRes.body).toMatchObject({ success: true, data: { articleCount: 1 } });
  });
});
