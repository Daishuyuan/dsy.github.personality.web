import { describe, expect, it } from "vitest";
import { runCellWar } from "../algorithms/cellWar";

describe("runCellWar", () => {
  it("returns one frame per simulated round plus the seed frame", () => {
    const result = runCellWar(12, 8);

    expect(result.frames).toHaveLength(9);
    expect(result.frames[0].grid).not.toEqual(result.frames[result.frames.length - 1].grid);
    expect(result.frames.every((frame) => frame.phase && frame.explanation && frame.metrics)).toBe(true);
    expect(Object.values(result.counts).reduce((sum, count) => sum + count, 0)).toBeGreaterThan(12);
  });
});
