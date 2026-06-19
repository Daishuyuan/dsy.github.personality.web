import type { AlgorithmPoint, AlgorithmResult, BasketballVisualization } from "../data/types";
import type { RendererHandle, RendererOptions } from "./renderLifecycle";
import { clearCanvas, createTimedAnimation, getFrameAnimationDuration } from "./renderLifecycle";

export function renderBasketball(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  options: RendererOptions = {}
): RendererHandle | null {
  if (!result.points) {
    clearCanvas(canvas);
    return null;
  }

  if (options.frameIndex !== undefined && result.frames?.length) {
    drawBasketballFrame(canvas, result, options.frameIndex);
    return null;
  }

  return createTimedAnimation(
    getFrameAnimationDuration(result.frames?.length, { maxMs: 7000, perFrameMs: 95 }),
    (progress) => {
      if (result.frames?.length) {
        const frameIndex = Math.min(result.frames.length - 1, Math.floor(progress * result.frames.length));
        drawBasketballFrame(canvas, result, frameIndex);
      } else {
        drawBasketball(canvas, result, progress);
      }
    }
  );
}

function drawBasketballFrame(canvas: HTMLCanvasElement, result: AlgorithmResult, frameIndex: number) {
  const frame = result.frames?.[Math.max(0, Math.min(frameIndex, result.frames.length - 1))];
  if (!frame) {
    drawBasketball(canvas, result, 1);
    return;
  }
  drawBasketball(canvas, { ...result, points: frame.points ?? result.points }, 1, frame.message);
}

function drawBasketball(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  progress: number,
  frameMessage?: string
) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.points) {
    return;
  }

  const { context, width, height } = prepared;
  const visualization = result.visualization?.kind === "basketball" ? result.visualization : null;
  const bounds = visualization?.bounds ?? { width: 560, height: 420 };
  const scale = Math.min(width / bounds.width, height / bounds.height);
  const offsetX = (width - bounds.width * scale) / 2;
  const offsetY = (height - bounds.height * scale) / 2;
  const project = (point: AlgorithmPoint) => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale
  });

  drawCourt(context, bounds, project, scale);
  if (visualization) {
    drawHoop(context, visualization, project, scale);
  }

  context.strokeStyle = "#116d6e";
  context.lineWidth = Math.max(2, 3 * scale);
  context.beginPath();
  const visiblePoints = Math.max(1, Math.ceil(result.points.length * progress));
  const activePoints = result.points.slice(0, visiblePoints);
  activePoints.map(project).forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  const ball = activePoints[activePoints.length - 1];
  if (ball) {
    drawBall(context, project(ball), Math.max(8, (visualization?.hoop.ballRadius ?? 10) * scale));
  }

  if (visualization?.collisions.length) {
    drawCollisions(context, visualization, activePoints.length - 1, project, scale);
  }

  const revealHit =
    visualization?.hitPoint &&
    (visualization.hitSampleIndex === null || activePoints.length - 1 >= visualization.hitSampleIndex);
  if (revealHit) {
    const hitPoint = project(visualization.hitPoint);
    context.strokeStyle = "rgba(116, 198, 157, 0.9)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(hitPoint.x, hitPoint.y, 14 * scale, 0, Math.PI * 2);
    context.stroke();
  }

  drawMessage(context, width, frameMessage);
}

function drawCourt(
  context: CanvasRenderingContext2D,
  bounds: { width: number; height: number },
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  const floorTop = project({ x: 0, y: bounds.height - 42 });
  context.fillStyle = "#1f2933";
  context.fillRect(floorTop.x, floorTop.y, bounds.width * scale, 42 * scale);
  context.strokeStyle = "rgba(31, 41, 51, 0.18)";
  context.lineWidth = 1;
  for (let x = 40; x < bounds.width; x += 40) {
    const top = project({ x, y: 0 });
    const bottom = project({ x, y: bounds.height - 42 });
    context.beginPath();
    context.moveTo(top.x, top.y);
    context.lineTo(bottom.x, bottom.y);
    context.stroke();
  }
}

function drawHoop(
  context: CanvasRenderingContext2D,
  visualization: BasketballVisualization,
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  const { hoop } = visualization;
  const backboardTop = project({ x: hoop.backboardX, y: hoop.backboardTop });
  const backboardBottom = project({ x: hoop.backboardX, y: hoop.backboardBottom });
  const rimCenter = project(hoop.rimCenter);
  const windowTopLeft = project({ x: hoop.hitWindow.left, y: hoop.hitWindow.top });
  const windowBottomRight = project({ x: hoop.hitWindow.right, y: hoop.hitWindow.bottom });

  context.fillStyle = "rgba(116, 198, 157, 0.13)";
  context.strokeStyle = "rgba(116, 198, 157, 0.88)";
  context.lineWidth = 2;
  context.fillRect(
    windowTopLeft.x,
    windowTopLeft.y,
    windowBottomRight.x - windowTopLeft.x,
    windowBottomRight.y - windowTopLeft.y
  );
  context.strokeRect(
    windowTopLeft.x,
    windowTopLeft.y,
    windowBottomRight.x - windowTopLeft.x,
    windowBottomRight.y - windowTopLeft.y
  );

  context.strokeStyle = "#36454f";
  context.lineWidth = Math.max(4, 6 * scale);
  context.beginPath();
  context.moveTo(backboardTop.x, backboardTop.y);
  context.lineTo(backboardBottom.x, backboardBottom.y);
  context.stroke();

  context.strokeStyle = "#f4a261";
  context.lineWidth = Math.max(3, 5 * scale);
  context.beginPath();
  context.ellipse(rimCenter.x, rimCenter.y, hoop.rimRadius * scale, 10 * scale, 0, 0, Math.PI * 2);
  context.stroke();
}

function drawCollisions(
  context: CanvasRenderingContext2D,
  visualization: BasketballVisualization,
  activeIndex: number,
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  for (const collision of visualization.collisions) {
    if (collision.sampleIndex > activeIndex) {
      continue;
    }
    const point = project(collision.point);
    context.save();
    const rimCollision = collision.kind === "rim";
    const backboardCollision = collision.kind === "backboard";
    context.strokeStyle = rimCollision ? "#f97316" : backboardCollision ? "#ef4444" : "#f59e0b";
    context.fillStyle = rimCollision
      ? "rgba(249, 115, 22, 0.18)"
      : backboardCollision
        ? "rgba(239, 68, 68, 0.16)"
        : "rgba(245, 158, 11, 0.16)";
    context.lineWidth = Math.max(2, 2 * scale);
    context.beginPath();
    context.arc(point.x, point.y, Math.max(8, 12 * scale), 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(point.x - 7 * scale, point.y - 7 * scale);
    context.lineTo(point.x + 7 * scale, point.y + 7 * scale);
    context.moveTo(point.x + 7 * scale, point.y - 7 * scale);
    context.lineTo(point.x - 7 * scale, point.y + 7 * scale);
    context.stroke();
    context.restore();
  }
}

function drawBall(context: CanvasRenderingContext2D, point: AlgorithmPoint, radius: number) {
  context.fillStyle = "#e76f51";
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(31, 41, 51, 0.38)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(point.x - radius, point.y);
  context.lineTo(point.x + radius, point.y);
  context.moveTo(point.x, point.y - radius);
  context.lineTo(point.x, point.y + radius);
  context.stroke();
}

function drawMessage(context: CanvasRenderingContext2D, width: number, frameMessage?: string) {
  if (!frameMessage) {
    return;
  }
  context.fillStyle = "rgba(31, 41, 51, 0.78)";
  context.fillRect(12, 12, Math.min(220, width - 24), 28);
  context.fillStyle = "#ffffff";
  context.font = "13px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(frameMessage, 24, 26);
}
