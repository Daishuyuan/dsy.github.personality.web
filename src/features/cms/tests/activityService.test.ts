import { beforeEach, describe, expect, it } from "vitest";
import { writeAuditEvent } from "../server/auditRepository";
import { listActivityRecords } from "../server/operationsService";
import { resetCmsMemoryStore } from "./fixtures";

describe("activity service", () => {
  beforeEach(() => resetCmsMemoryStore());

  it("shapes safe activity records", async () => {
    await writeAuditEvent({ action: "storage.failure", actor: "owner", details: { message: "图片存储失败", serviceKey: "raw" } });

    const result = await listActivityRecords({ page: 1, pageSize: 10 });

    expect(result.items[0]).toMatchObject({ result: "failure", summary: "图片存储失败" });
    expect(JSON.stringify(result.items)).not.toContain("raw");
  });
});
