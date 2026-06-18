import { describe, expect, it } from "vitest";
import { countLakes } from "../algorithms/lakeCounting";

describe("countLakes", () => {
  it("counts four-direction components", () => {
    expect(countLakes("W.\n.W", false).count).toBe(2);
  });

  it("counts eight-direction components", () => {
    expect(countLakes("W.\n.W", true).count).toBe(1);
  });
});
