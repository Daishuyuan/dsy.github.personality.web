import { describe, expect, it } from "vitest";
import { calculateCircleCenter } from "../algorithms/circleCenter";

describe("calculateCircleCenter", () => {
  it("calculates a normal circumcenter", () => {
    const result = calculateCircleCenter("0,1;1,0;-1,0");
    expect(result.center?.x).toBeCloseTo(0, 4);
    expect(result.center?.y).toBeCloseTo(0, 4);
    expect(result.radius).toBeCloseTo(1, 4);
  });

  it("handles collinear points as degenerate", () => {
    const result = calculateCircleCenter("0,0;1,1;2,2");
    expect(result.center).toBeNull();
    expect(result.radius).toBeNull();
  });
});
