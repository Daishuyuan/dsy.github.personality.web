import { parsePoints } from "./validation";

export interface CircleCenterResult {
  points: Array<{ x: number; y: number }>;
  center: { x: number; y: number } | null;
  radius: number | null;
}

export function calculateCircleCenter(pointsText: string): CircleCenterResult {
  const points = parsePoints(pointsText);
  if (points.length !== 3) {
    throw new Error("圆心计算需要 3 个点。");
  }

  const [a, b, c] = points;
  const d =
    2 *
    (a.x * (b.y - c.y) +
      b.x * (c.y - a.y) +
      c.x * (a.y - b.y));

  if (Math.abs(d) < 1e-9) {
    return { points, center: null, radius: null };
  }

  const ux =
    ((a.x ** 2 + a.y ** 2) * (b.y - c.y) +
      (b.x ** 2 + b.y ** 2) * (c.y - a.y) +
      (c.x ** 2 + c.y ** 2) * (a.y - b.y)) /
    d;
  const uy =
    ((a.x ** 2 + a.y ** 2) * (c.x - b.x) +
      (b.x ** 2 + b.y ** 2) * (a.x - c.x) +
      (c.x ** 2 + c.y ** 2) * (b.x - a.x)) /
    d;

  const center = { x: ux, y: uy };
  const radius = Math.hypot(center.x - a.x, center.y - a.y);

  return { points, center, radius };
}
