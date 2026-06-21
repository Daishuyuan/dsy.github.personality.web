import { beforeEach, describe, expect, it, vi } from "vitest";
import auditHandler from "../server/apiHandlers/audit";
import { writeAuditEvent } from "../server/auditRepository";
import { createApiResponse, ownerHeaders, resetCmsMemoryStore } from "./fixtures";

describe("audit API", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_TOKEN", "test-admin-token");
    resetCmsMemoryStore();
  });

  it("filters owner-visible audit records", async () => {
    await writeAuditEvent({ action: "article.update", actor: "owner", articleId: "post:test" });
    const res = createApiResponse();

    await auditHandler({ method: "GET", headers: ownerHeaders(), query: { action: "article.update" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { total: 1 } });
  });
});
