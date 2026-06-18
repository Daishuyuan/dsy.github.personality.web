import { parseNumberList } from "./validation";

export interface CraneResult {
  segments: number[];
  rotations: number[];
  points: Array<{ x: number; y: number }>;
  endpoint: { x: number; y: number };
}

export function calculateCrane(segmentsText: string, rotationsText: string): CraneResult {
  const segments = parseNumberList(segmentsText);
  const rotations = parseNumberList(rotationsText);
  if (segments.some((segment) => segment <= 0)) {
    throw new Error("线段长度必须为正数。");
  }

  const points = [{ x: 0, y: 0 }];
  let angle = -90;
  let x = 0;
  let y = 0;

  for (let index = 0; index < segments.length; index += 1) {
    angle += rotations[index] ?? 0;
    const radians = (angle * Math.PI) / 180;
    x += Math.cos(radians) * segments[index];
    y += Math.sin(radians) * segments[index];
    points.push({ x, y });
  }

  return {
    segments,
    rotations,
    points,
    endpoint: { x, y }
  };
}
