import { parseMatrix } from "./validation";

export interface LakeCountingResult {
  count: number;
  grid: string[][];
  visited: boolean[][];
}

export function countLakes(gridText: string, eightDir: boolean): LakeCountingResult {
  const grid = parseMatrix(gridText);
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const directions = eightDir
    ? [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
      ]
    : [
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, 0]
      ];

  function isWater(row: number, col: number) {
    return grid[row][col].toUpperCase() === "W";
  }

  function flood(startRow: number, startCol: number) {
    const stack = [[startRow, startCol]];
    visited[startRow][startCol] = true;

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      const [row, col] = current;
      for (const [dRow, dCol] of directions) {
        const nextRow = row + dRow;
        const nextCol = col + dCol;
        if (
          nextRow >= 0 &&
          nextRow < rows &&
          nextCol >= 0 &&
          nextCol < cols &&
          !visited[nextRow][nextCol] &&
          isWater(nextRow, nextCol)
        ) {
          visited[nextRow][nextCol] = true;
          stack.push([nextRow, nextCol]);
        }
      }
    }
  }

  let count = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!visited[row][col] && isWater(row, col)) {
        count += 1;
        flood(row, col);
      }
    }
  }

  return { count, grid, visited };
}
