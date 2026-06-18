import { describe, expect, it } from "vitest";
import { runAlgorithm } from "../algorithms";
import { algorithms } from "../data/catalog";

const framedAlgorithms = algorithms.filter(
  (algorithm) => algorithm.slug !== "ip-address-split" && algorithm.slug !== "crane"
);

const expectedMetricKeys: Record<string, string[]> = {
  basketball: ["time", "velocityY", "hit"],
  "cell-war": ["day", "A", "B"],
  "circle-center": ["determinant", "radius"],
  "cute-box": ["event", "inventory", "step", "updatedQ"],
  "escape-pathfinding": ["frontier", "visited", "pathLength"],
  "lake-counting": ["components", "visited"],
  "perfect-world": ["kineticEnergy", "centerPull", "collisions"]
};

describe("visual algorithm frame metadata", () => {
  it("adds phase, explanation, and metrics to every animated frame", () => {
    for (const algorithm of framedAlgorithms) {
      const result = runAlgorithm(algorithm.slug, algorithm.defaultState);

      expect(result.frames?.length, algorithm.slug).toBeGreaterThan(1);
      expect(
        result.frames?.every((frame) => frame.phase && frame.explanation && frame.metrics),
        algorithm.slug
      ).toBe(true);
    }
  });

  it("uses domain-specific metrics rather than generic reveal counters", () => {
    for (const algorithm of framedAlgorithms) {
      const result = runAlgorithm(algorithm.slug, algorithm.defaultState);
      const metricKeys = new Set(result.frames?.flatMap((frame) => Object.keys(frame.metrics ?? {})));

      for (const key of expectedMetricKeys[algorithm.slug] ?? []) {
        expect(metricKeys.has(key), `${algorithm.slug} missing ${key}`).toBe(true);
      }
    }
  });
});
