import type { AlgorithmResult } from "../data/types";
import { clearCanvas } from "./renderLifecycle";

export function renderGeometry(canvas: HTMLCanvasElement, result: AlgorithmResult) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.points || result.points.length === 0) {
    return;
  }

  const { context, width, height } = prepared;
  const xs = result.points.map((point) => point.x);
  const ys = result.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((width - 80) / spanX, (height - 80) / spanY);

  const project = (point: { x: number; y: number }) => ({
    x: (point.x - minX) * scale + 40,
    y: height - ((point.y - minY) * scale + 40)
  });

  const projected = result.points.map(project);
  context.strokeStyle = "#116d6e";
  context.lineWidth = 3;
  context.beginPath();
  projected.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  projected.forEach((point, index) => {
    context.fillStyle = index === projected.length - 1 ? "#f28482" : "#0b4f50";
    context.beginPath();
    context.arc(point.x, point.y, index === projected.length - 1 ? 7 : 5, 0, Math.PI * 2);
    context.fill();
  });
}
