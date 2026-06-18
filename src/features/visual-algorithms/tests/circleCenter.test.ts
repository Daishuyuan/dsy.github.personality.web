import { describe, expect, it } from "vitest";
import { runAlgorithm } from "../algorithms";
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

  it("keeps playback frames stage-specific instead of drawing the final circle immediately", () => {
    const result = runAlgorithm("circle-center", { points: "0,1;1,0;-1,0" });
    const frames = result.frames ?? [];

    expect(frames[0].visualization?.kind).toBe("circle-center");
    if (frames[0].visualization?.kind === "circle-center") {
      expect(frames[0].visualization.inputPoints).toHaveLength(1);
      expect(frames[0].visualization.center).toBeNull();
      expect(frames[0].visualization.radius).toBeNull();
    }

    const finalFrame = frames[frames.length - 1];
    expect(finalFrame.visualization?.kind).toBe("circle-center");
    if (finalFrame.visualization?.kind === "circle-center") {
      expect(finalFrame.visualization.inputPoints).toHaveLength(3);
      expect(finalFrame.visualization.center).not.toBeNull();
      expect(finalFrame.visualization.radius).toBeCloseTo(1, 4);
    }
  });
});
