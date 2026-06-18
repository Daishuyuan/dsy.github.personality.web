import { describe, expect, it } from "vitest";
import { validateControls } from "../algorithms/validation";
import { getAlgorithmBySlug } from "../data/catalog";

describe("validateControls", () => {
  it("applies min and max constraints to slider-list values", () => {
    const crane = getAlgorithmBySlug("crane");
    expect(crane).toBeDefined();
    if (!crane) {
      return;
    }

    expect(validateControls(crane.controls, { segments: "80,70,60,50", rotations: "0,25,-35,20" }).ok).toBe(true);
    expect(validateControls(crane.controls, { segments: "80,-1,60,50", rotations: "0,25,-35,20" }).ok).toBe(false);
    expect(validateControls(crane.controls, { segments: "80,70,60,50", rotations: "0,181,-35,20" }).ok).toBe(false);
  });
});
