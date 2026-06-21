import { beforeEach, describe, expect, it, vi } from "vitest";
import verificationHandler from "../server/apiHandlers/verification";
import { createApiResponse, ownerHeaders, resetCmsMemoryStore } from "./fixtures";

describe("verification API", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_TOKEN", "test-admin-token");
    resetCmsMemoryStore();
  });

  it("denies non-owner and runs for owner", async () => {
    const denied = createApiResponse();
    await verificationHandler({ method: "POST", headers: {}, body: {} }, denied);
    expect(denied.statusCode).toBe(401);

    const allowed = createApiResponse();
    await verificationHandler({ method: "POST", headers: ownerHeaders(), body: {} }, allowed);
    expect(allowed.statusCode).toBe(201);
    expect(allowed.body).toMatchObject({ success: true, data: { steps: expect.any(Array) } });
  });
});
