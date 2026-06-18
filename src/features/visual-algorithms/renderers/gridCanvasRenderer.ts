import type { AlgorithmResult } from "../data/types";
import { clearCanvas } from "./renderLifecycle";

export function renderGrid(canvas: HTMLCanvasElement, result: AlgorithmResult) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.grid) {
    return;
  }

  const { context, width, height } = prepared;
  const rows = result.grid.length;
  const cols = result.grid[0]?.length ?? 1;
  const cell = Math.min(width / cols, height / rows);
  const offsetX = (width - cell * cols) / 2;
  const offsetY = (height - cell * rows) / 2;
  const pathKeys = new Set((result.path ?? []).map((point) => `${point.x},${point.y}`));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = result.grid[row][col];
      const x = offsetX + col * cell;
      const y = offsetY + row * cell;
      context.fillStyle = colorForCell(value, pathKeys.has(`${col},${row}`));
      context.fillRect(x, y, cell, cell);
      context.strokeStyle = "rgba(31, 41, 51, 0.16)";
      context.strokeRect(x, y, cell, cell);
      if (cell > 18 && value !== ".") {
        context.fillStyle = "#1f2933";
        context.font = `${Math.max(11, cell * 0.34)}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(value, x + cell / 2, y + cell / 2);
      }
    }
  }
}

function colorForCell(value: string, inPath: boolean) {
  if (inPath) {
    return "#f9c74f";
  }
  if (value.toUpperCase() === "W") {
    return "#78c6d8";
  }
  if (value === "#") {
    return "#36454f";
  }
  if (value === "S") {
    return "#74c69d";
  }
  if (value === "E" || value === "G") {
    return "#f28482";
  }
  if (value === "A") {
    return "#f4a261";
  }
  if (value === "*") {
    return "#b7e4c7";
  }
  if (/^[A-D]$/.test(value)) {
    return {
      A: "#90be6d",
      B: "#43aa8b",
      C: "#577590",
      D: "#f3722c"
    }[value] ?? "#e9ecef";
  }
  return "#f8fafc";
}
