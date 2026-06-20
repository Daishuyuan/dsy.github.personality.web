import { describe, expect, it } from "vitest";
import { enforceRateLimit, hashValue, withIdempotency } from "../server/requestSafety";

describe("request safety", () => {
  it("hashes retry keys without exposing raw values", () => {
    expect(hashValue("secret")).toHaveLength(64);
    expect(hashValue("secret")).not.toBe("secret");
  });

  it("returns the same idempotent result for the same key and payload", async () => {
    const req = { headers: { "idempotency-key": "abc" } };
    const first = await withIdempotency(req, { a: 1 }, async () => ({ value: Math.random() }));
    const second = await withIdempotency(req, { a: 1 }, async () => ({ value: Math.random() }));
    expect(second).toEqual(first);
  });

  it("limits repeated requests", () => {
    enforceRateLimit("unit-test-limit", 1, 1_000);
    expect(() => enforceRateLimit("unit-test-limit", 1, 1_000)).toThrow();
  });
});
