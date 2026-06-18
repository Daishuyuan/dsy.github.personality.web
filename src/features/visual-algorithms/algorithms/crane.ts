import { parseNumberList } from "./validation";
import type { AlgorithmPoint, CraneVisualization } from "../data/types";

export interface CraneResult {
  segments: number[];
  rotations: number[];
  points: AlgorithmPoint[];
  endpoint: AlgorithmPoint;
  vectors: AlgorithmPoint[];
  treeNodes: CraneVisualization["treeNodes"];
  visualization: CraneVisualization;
}

export function calculateCrane(segmentsText: string, rotationsText: string): CraneResult {
  const segments = parseNumberList(segmentsText);
  const rotations = parseNumberList(rotationsText);
  if (segments.some((segment) => segment <= 0)) {
    throw new Error("线段长度必须为正数。");
  }

  const points = [{ x: 0, y: 0 }];
  const vectors: AlgorithmPoint[] = [];
  let cumulativeClockwiseAngle = 0;
  let x = 0;
  let y = 0;

  for (let index = 0; index < segments.length; index += 1) {
    cumulativeClockwiseAngle += rotations[index] ?? 0;
    const radians = ((90 - cumulativeClockwiseAngle) * Math.PI) / 180;
    const vector = {
      x: Math.cos(radians) * segments[index],
      y: Math.sin(radians) * segments[index]
    };
    vectors.push(vector);
    x += vector.x;
    y += vector.y;
    points.push({ x, y });
  }

  const treeNodes = buildCraneTree(vectors);

  return {
    segments,
    rotations,
    points,
    endpoint: { x, y },
    vectors,
    treeNodes,
    visualization: {
      kind: "crane",
      base: points[0],
      treeNodes
    }
  };
}

function buildCraneTree(vectors: AlgorithmPoint[]): CraneVisualization["treeNodes"] {
  if (vectors.length === 0) {
    return [];
  }
  const nodes: CraneVisualization["treeNodes"] = [];
  const visit = (start: number, end: number, depth: number): AlgorithmPoint => {
    if (start === end) {
      const vector = vectors[start];
      nodes.push({
        id: `${start + 1}`,
        start,
        end,
        x: vector.x,
        y: vector.y,
        depth
      });
      return vector;
    }

    const mid = Math.floor((start + end) / 2);
    const left = visit(start, mid, depth + 1);
    const right = visit(mid + 1, end, depth + 1);
    const vector = { x: left.x + right.x, y: left.y + right.y };
    nodes.push({
      id: `${start + 1}-${end + 1}`,
      start,
      end,
      x: vector.x,
      y: vector.y,
      depth
    });
    return vector;
  };

  visit(0, vectors.length - 1, 0);
  return nodes.sort((left, right) => left.depth - right.depth || left.start - right.start || left.end - right.end);
}
