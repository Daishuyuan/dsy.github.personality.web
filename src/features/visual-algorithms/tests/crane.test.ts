import { describe, expect, it } from "vitest";
import { runAlgorithm } from "../algorithms";
import { calculateCrane } from "../algorithms/crane";
import { getCraneScaleExtent } from "../renderers/geometryCanvasRenderer";

describe("calculateCrane", () => {
  it("calculates endpoint from segment lengths and rotations", () => {
    const result = calculateCrane("10,10", "90,0");
    expect(result.points).toHaveLength(3);
    expect(result.endpoint.x).toBeCloseTo(20, 4);
    expect(result.endpoint.y).toBeCloseTo(0, 4);
  });

  it("applies each joint rotation to the suffix segments like the legacy implementation", () => {
    const result = calculateCrane("10,10", "0,90");

    expect(result.points[1]?.x).toBeCloseTo(0, 4);
    expect(result.points[1]?.y).toBeCloseTo(10, 4);
    expect(result.endpoint.x).toBeCloseTo(10, 4);
    expect(result.endpoint.y).toBeCloseTo(10, 4);
  });

  it("keeps the segment-tree root vector equal to the crane endpoint", () => {
    const result = calculateCrane("80,70,60,50", "0,25,-35,20");
    const root = result.treeNodes.find((node) => node.start === 0 && node.end === result.segments.length - 1);

    expect(root).toBeDefined();
    expect(root?.x).toBeCloseTo(result.endpoint.x, 4);
    expect(root?.y).toBeCloseTo(result.endpoint.y, 4);
  });

  it("keeps the render scale stable while rotating fixed-length segments", () => {
    const straight = calculateCrane("80,70,60,50", "0,0,0,0");
    const rotated = calculateCrane("80,70,60,50", "0,25,-35,20");

    expect(getCraneScaleExtent(straight.points)).toBeCloseTo(260, 4);
    expect(getCraneScaleExtent(rotated.points)).toBeCloseTo(getCraneScaleExtent(straight.points), 4);
  });

  it("renders immediately without playback frames", () => {
    const result = runAlgorithm("crane", { segments: "80,70,60,50", rotations: "0,25,-35,20" });

    expect(result.frames).toBeUndefined();
    expect(result.metrics?.endpointX).toBe("27.8");
    expect(result.metrics?.endpointY).toBe("251.8");
  });
});
