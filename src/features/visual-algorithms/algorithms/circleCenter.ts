import { parsePoints } from "./validation";
import type { AlgorithmPoint, CircleCenterVisualization } from "../data/types";

export interface CircleCenterResult {
  points: AlgorithmPoint[];
  center: AlgorithmPoint | null;
  radius: number | null;
  determinant: number;
  visualization: CircleCenterVisualization;
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

  const bisectors = [
    buildBisector("AB", a, b),
    buildBisector("BC", b, c)
  ];

  if (Math.abs(d) < 1e-9) {
    return {
      points,
      center: null,
      radius: null,
      determinant: d,
      visualization: {
        kind: "circle-center",
        inputPoints: points,
        center: null,
        radius: null,
        bisectors
      }
    };
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

  return {
    points,
    center,
    radius,
    determinant: d,
    visualization: {
      kind: "circle-center",
      inputPoints: points,
      center,
      radius,
      bisectors
    }
  };
}

function buildBisector(label: string, left: AlgorithmPoint, right: AlgorithmPoint) {
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    label,
    midpoint: {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2
    },
    direction: {
      x: -dy / length,
      y: dx / length
    }
  };
}
