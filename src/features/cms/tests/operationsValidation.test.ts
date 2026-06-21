import { describe, expect, it } from "vitest";
import { assetListQuerySchema, auditListQuerySchema, healthRunSchema, operationsSummaryQuerySchema, verificationRunSchema } from "../validation";

describe("CMS operations validation", () => {
  it("accepts bounded operations defaults", () => {
    expect(operationsSummaryQuerySchema.parse({}).includeIssues).toBe(false);
    expect(healthRunSchema.parse({}).scope).toBe("all");
    expect(verificationRunSchema.parse({}).scope).toBe("cms-critical");
  });

  it("rejects unsafe pagination and filters", () => {
    expect(() => assetListQuerySchema.parse({ pageSize: 500 })).toThrow();
    expect(() => auditListQuerySchema.parse({ action: "secret.dump" })).toThrow();
    expect(() => auditListQuerySchema.parse({ articleId: "../../x" })).toThrow();
  });
});
