import { describe, expect, it } from "vitest";
import { findEscapePath } from "../algorithms/escapePathfinding";

describe("findEscapePath", () => {
  it("finds reachable path", () => {
    const result = findEscapePath("S..\n.#.\n..E");
    expect(result.reachable).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("reports unreachable grid", () => {
    const result = findEscapePath("S#E");
    expect(result.reachable).toBe(false);
    expect(result.path).toEqual([]);
  });
});
