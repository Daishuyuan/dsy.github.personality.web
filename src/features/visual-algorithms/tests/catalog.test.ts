import { describe, expect, it } from "vitest";
import { algorithms, categories } from "../data/catalog";

describe("visual algorithm catalog", () => {
  it("contains exactly the approved public menu algorithms", () => {
    expect(algorithms).toHaveLength(10);
    expect(algorithms.map((algorithm) => algorithm.slug).sort()).toEqual([
      "basketball",
      "cell-war",
      "circle-center",
      "crane",
      "cute-box",
      "escape-pathfinding",
      "ip-address-split",
      "lake-counting",
      "perfect-world",
      "three-js-playground"
    ]);
  });

  it("uses unique slugs and valid categories", () => {
    const categoryIds = new Set(categories.map((category) => category.id));
    const slugs = new Set(algorithms.map((algorithm) => algorithm.slug));
    expect(slugs.size).toBe(algorithms.length);
    expect(algorithms.every((algorithm) => categoryIds.has(algorithm.categoryId))).toBe(true);
  });

  it("keeps legacy references scoped to public html demos", () => {
    expect(algorithms.every((algorithm) => algorithm.legacyReference.endsWith(".html"))).toBe(true);
    expect(algorithms.some((algorithm) => algorithm.legacyReference.includes("Test_WASM"))).toBe(false);
  });
});
