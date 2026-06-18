import { describe, expect, it } from "vitest";
import { runCuteBox } from "../algorithms/cuteBox";

describe("runCuteBox", () => {
  it("builds an Ajatar-style reward world with weapons and hazards", () => {
    const result = runCuteBox(8, 8, 1, true);
    const initialValues = new Set(result.frames[0]?.grid?.flat() ?? []);

    expect(initialValues.has("K")).toBe(true);
    expect(initialValues.has("H")).toBe(true);
    expect(initialValues.has("D")).toBe(true);
    expect(initialValues.has("T")).toBe(true);
    expect(initialValues.has("R")).toBe(true);
    expect(result.itemCounts.sword).toBeGreaterThan(0);
    expect(result.itemCounts.shield).toBeGreaterThan(0);
    expect(result.itemCounts.dragon + result.itemCounts.trap + result.itemCounts.beam).toBeGreaterThan(0);
  });

  it("includes inventory in Q-learning state keys", () => {
    const result = runCuteBox(8, 8, 24, true);
    const states = result.frames.map((frame) => String(frame.metrics?.state ?? "")).filter(Boolean);

    expect(states.length).toBeGreaterThan(0);
    expect(states.every((state) => /\|K[01]\|H[01]$/.test(state))).toBe(true);
  });

  it("emits directional poses and event effects for game-like exploration", () => {
    const result = runCuteBox(8, 8, 160, true);
    const directions = new Set(result.frames.map((frame) => frame.agentDirection).filter(Boolean));
    const agentStates = new Set(result.frames.map((frame) => frame.agentState).filter(Boolean));
    const effects = new Set(result.frames.map((frame) => frame.eventEffect).filter(Boolean));

    expect(directions.size).toBeGreaterThan(1);
    expect(agentStates.has("loot")).toBe(true);
    expect(agentStates.has("dead") || agentStates.has("victory")).toBe(true);
    expect(
      ["rock-break", "dragon-defeat", "item-pickup", "shield-block", "trap-trigger", "dragon-attack", "wall-hit", "goal-reached"]
        .some((effect) => effects.has(effect))
    ).toBe(true);
  });

  it("emits TD update metrics when Q-Learning is enabled", () => {
    const result = runCuteBox(6, 6, 12, true);
    const updates = result.frames
      .map((frame) => String(frame.metrics?.updatedQ ?? ""))
      .filter(Boolean);

    expect(updates.length).toBeGreaterThan(0);
    expect(updates.some((value) => value !== "0.00")).toBe(true);
  });

  it("keeps the greedy baseline separate from Q-Learning updates", () => {
    const result = runCuteBox(6, 6, 12, false);
    const updates = result.frames
      .map((frame) => String(frame.metrics?.updatedQ ?? ""))
      .filter(Boolean);

    expect(updates.every((value) => value === "0.00")).toBe(true);
  });
});
