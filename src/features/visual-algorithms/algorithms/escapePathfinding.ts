import { parseMatrix } from "./validation";

export interface EscapeResult {
  grid: string[][];
  path: Array<{ x: number; y: number }>;
  reachable: boolean;
  visitedOrder: Array<{ x: number; y: number }>;
  trace: EscapeTraceStep[];
}

export interface EscapeTraceStep {
  current: { x: number; y: number };
  frontier: Array<{ x: number; y: number }>;
  visited: Array<{ x: number; y: number }>;
}

export function findEscapePath(gridText: string): EscapeResult {
  const grid = parseMatrix(gridText);
  let start: { x: number; y: number } | null = null;
  let end: { x: number; y: number } | null = null;

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === "S") {
        start = { x, y };
      }
      if (grid[y][x] === "E") {
        end = { x, y };
      }
    }
  }

  if (!start || !end) {
    throw new Error("地图必须包含 S 和 E。");
  }

  const key = (point: { x: number; y: number }) => `${point.x},${point.y}`;
  const queue = [start];
  const previous = new Map<string, string | null>([[key(start), null]]);
  const visitedOrder = [start];
  const trace: EscapeTraceStep[] = [];
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current.x === end.x && current.y === end.y) {
      trace.push({ current, frontier: queue.slice(), visited: visitedOrder.slice() });
      break;
    }
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (
        next.y < 0 ||
        next.y >= grid.length ||
        next.x < 0 ||
        next.x >= grid[0].length ||
        grid[next.y][next.x] === "#"
      ) {
        continue;
      }
      const nextKey = key(next);
      if (!previous.has(nextKey)) {
        previous.set(nextKey, key(current));
        visitedOrder.push(next);
        queue.push(next);
      }
    }
    trace.push({ current, frontier: queue.slice(), visited: visitedOrder.slice() });
  }

  if (!previous.has(key(end))) {
    return { grid, path: [], reachable: false, visitedOrder, trace };
  }

  const path: Array<{ x: number; y: number }> = [];
  let cursor: string | null = key(end);
  while (cursor) {
    const [x, y] = cursor.split(",").map(Number);
    path.push({ x, y });
    cursor = previous.get(cursor) ?? null;
  }
  path.reverse();

  return { grid, path, reachable: true, visitedOrder, trace };
}
