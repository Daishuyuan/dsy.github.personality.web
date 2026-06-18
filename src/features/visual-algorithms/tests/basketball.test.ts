import { describe, expect, it } from "vitest";
import { runAlgorithm } from "../algorithms";
import { basketballSampleRate, runBasketball } from "../algorithms/basketball";

describe("runBasketball", () => {
  it("does not count an upward pass through the target window as a hit", () => {
    const result = runBasketball(25, 44);

    expect(result.metrics.hit).toBe("未命中");
    expect(result.visualization.hitPoint).toBeNull();
    expect(result.visualization.hitSampleIndex).toBeNull();
  });

  it("counts a descending rim-plane crossing as a hit", () => {
    const result = runBasketball(23, 52);

    expect(result.metrics.hit).toBe("命中窗口");
    expect(result.visualization.hitPoint?.y).toBe(result.visualization.hoop.rimCenter.y);
    expect(result.visualization.hitSampleIndex).toBeGreaterThan(0);
  });

  it("keeps frame time metadata aligned with the trajectory sampling rate", () => {
    const result = runAlgorithm("basketball", { speed: 23, angle: 52 });
    const frames = result.frames ?? [];
    const hitSampleIndex =
      result.visualization?.kind === "basketball" ? result.visualization.hitSampleIndex : null;

    expect(frames[1].metrics?.time).toBe((1 / basketballSampleRate).toFixed(2));
    expect(frames[frames.length - 1].metrics?.time).toBe(String(result.metrics?.flightTime));
    expect(hitSampleIndex).not.toBeNull();
    if (hitSampleIndex !== null) {
      expect(frames[hitSampleIndex - 1].metrics?.hit).toBe("检测中");
      expect(frames[hitSampleIndex].metrics?.hit).toBe("命中窗口");
    }
  });
});
