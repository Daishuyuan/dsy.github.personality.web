import { describe, expect, it } from "vitest";
import { calculateCrane } from "../algorithms/crane";

describe("calculateCrane", () => {
  it("calculates endpoint from segment lengths and rotations", () => {
    const result = calculateCrane("10,10", "90,0");
    expect(result.points).toHaveLength(3);
    expect(result.endpoint.x).toBeCloseTo(20, 4);
    expect(result.endpoint.y).toBeCloseTo(0, 4);
  });
});
