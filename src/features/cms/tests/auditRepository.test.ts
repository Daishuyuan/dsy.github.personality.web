import { beforeEach, describe, expect, it } from "vitest";
import { listAuditEvents, writeAuditEvent } from "../server/auditRepository";
import { resetCmsMemoryStore } from "./fixtures";

describe("audit repository listing", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("lists newest events first and redacts sensitive detail keys", async () => {
    await writeAuditEvent({ action: "article.update", actor: "owner", details: { token: "raw", nested: { password: "raw" } } });
    await writeAuditEvent({ action: "health.run", actor: "owner", details: { result: "success" } });

    const result = await listAuditEvents({ page: 1, pageSize: 10 });

    expect(result.total).toBe(2);
    expect(result.items[0].action).toBe("health.run");
    expect(result.items[1].details).toMatchObject({ token: "[redacted]", nested: { password: "[redacted]" } });
  });

  it("filters by action and paginates", async () => {
    await writeAuditEvent({ action: "asset.upload", actor: "owner" });
    await writeAuditEvent({ action: "article.update", actor: "owner" });

    const result = await listAuditEvents({ action: "asset.upload", page: 1, pageSize: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].action).toBe("asset.upload");
  });
});
