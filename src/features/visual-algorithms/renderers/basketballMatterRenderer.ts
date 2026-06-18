import type { AlgorithmResult } from "../data/types";
import { clearCanvas } from "./renderLifecycle";

export function renderBasketball(canvas: HTMLCanvasElement, result: AlgorithmResult) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.points) {
    return;
  }

  const { context, width, height } = prepared;
  context.fillStyle = "#1f2933";
  context.fillRect(0, height - 42, width, 42);
  context.strokeStyle = "#f4a261";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(width - 120, 140, 34, 0, Math.PI);
  context.stroke();
  context.strokeStyle = "#116d6e";
  context.lineWidth = 3;
  context.beginPath();
  result.points.forEach((point, index) => {
    const x = Math.min(width - 20, point.x);
    const y = Math.max(28, Math.min(height - 50, point.y));
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();

  const ball = result.points[result.points.length - 1];
  if (ball) {
    context.fillStyle = "#e76f51";
    context.beginPath();
    context.arc(Math.min(width - 20, ball.x), Math.min(height - 50, ball.y), 12, 0, Math.PI * 2);
    context.fill();
  }
}
