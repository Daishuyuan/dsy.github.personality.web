import type {
  AlgorithmPoint,
  AlgorithmResult,
  CircleCenterVisualization,
  CraneVisualization,
  ParticleWorldVisualization
} from "../data/types";
import type { RendererHandle, RendererOptions } from "./renderLifecycle";
import { clearCanvas, createTimedAnimation, getFrameAnimationDuration } from "./renderLifecycle";

export function renderGeometry(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  options: RendererOptions = {}
): RendererHandle | null {
  if (!result.points || result.points.length === 0) {
    clearCanvas(canvas);
    return null;
  }

  if (options.frameIndex !== undefined && result.frames?.length) {
    drawGeometryFrame(canvas, result, options.frameIndex);
    return null;
  }

  if (result.visualization?.kind === "crane" && !result.frames?.length) {
    drawGeometry(canvas, result, 1, 0);
    return null;
  }

  return createTimedAnimation(getFrameAnimationDuration(result.frames?.length), (progress, elapsedMs) => {
    if (result.frames?.length) {
      const frameIndex = Math.min(result.frames.length - 1, Math.floor(progress * result.frames.length));
      drawGeometryFrame(canvas, result, frameIndex, elapsedMs);
    } else {
      drawGeometry(canvas, result, progress, elapsedMs);
    }
  });
}

function drawGeometryFrame(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  frameIndex: number,
  elapsedMs = 0
) {
  const frame = result.frames?.[Math.max(0, Math.min(frameIndex, result.frames.length - 1))];
  if (!frame) {
    drawGeometry(canvas, result, 1, elapsedMs);
    return;
  }
  drawGeometry(
    canvas,
    {
      ...result,
      points: frame.points ?? result.points,
      path: frame.path ?? result.path,
      trails: frame.trails ?? result.trails,
      visualization: frame.visualization ?? result.visualization
    },
    1,
    elapsedMs,
    frame.message
  );
}

function drawGeometry(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  progress: number,
  elapsedMs: number,
  frameMessage?: string
) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.points || result.points.length === 0) {
    return;
  }

  const visualization = result.visualization;
  if (visualization?.kind === "circle-center") {
    drawCircleCenter(prepared, result, visualization, progress, elapsedMs, frameMessage);
    return;
  }
  if (visualization?.kind === "crane") {
    drawCrane(prepared, result, visualization, elapsedMs, frameMessage);
    return;
  }
  if (visualization?.kind === "particle-world") {
    drawParticleWorld(prepared, result, visualization, elapsedMs, frameMessage);
    return;
  }

  drawPolyline(prepared, result, progress, elapsedMs, frameMessage);
}

function drawCircleCenter(
  prepared: NonNullable<ReturnType<typeof clearCanvas>>,
  result: AlgorithmResult,
  visualization: CircleCenterVisualization,
  progress: number,
  elapsedMs: number,
  frameMessage?: string
) {
  const { context, width, height } = prepared;
  const extentPoints = visualization.center && visualization.radius
    ? [
        ...visualization.inputPoints,
        { x: visualization.center.x - visualization.radius, y: visualization.center.y - visualization.radius },
        { x: visualization.center.x + visualization.radius, y: visualization.center.y + visualization.radius }
      ]
    : visualization.inputPoints;
  const project = createProjector(extentPoints, width, height, "screen");
  const input = visualization.inputPoints.map(project);
  const visibleInput = input.slice(0, Math.max(1, Math.ceil(input.length * Math.min(1, progress))));

  context.strokeStyle = "rgba(17, 109, 110, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  visibleInput.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  if (visibleInput.length === input.length) {
    context.closePath();
  }
  context.stroke();

  context.save();
  context.setLineDash([8, 7]);
  context.strokeStyle = "rgba(242, 132, 130, 0.78)";
  for (const bisector of visualization.bisectors) {
    const start = project({
      x: bisector.midpoint.x - bisector.direction.x * 1000,
      y: bisector.midpoint.y - bisector.direction.y * 1000
    });
    const end = project({
      x: bisector.midpoint.x + bisector.direction.x * 1000,
      y: bisector.midpoint.y + bisector.direction.y * 1000
    });
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  context.restore();

  if (visualization.center && visualization.radius) {
    const center = project(visualization.center);
    const radiusPoint = project({ x: visualization.center.x + visualization.radius, y: visualization.center.y });
    const radius = Math.abs(radiusPoint.x - center.x);
    context.strokeStyle = "#116d6e";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = "rgba(17, 109, 110, 0.5)";
    context.beginPath();
    context.moveTo(center.x, center.y);
    context.lineTo(input[0].x, input[0].y);
    context.stroke();

    drawPoint(context, center, "#f28482", 8 + Math.sin(elapsedMs / 140) * 1.5);
  }

  input.forEach((point, index) => {
    drawPoint(context, point, index < visibleInput.length ? "#0b4f50" : "rgba(11, 79, 80, 0.24)", 6);
    context.fillStyle = "#1f2933";
    context.font = "12px sans-serif";
    context.fillText(["A", "B", "C"][index] ?? "", point.x + 8, point.y - 8);
  });

  drawMessage(context, width, frameMessage);
}

function drawCrane(
  prepared: NonNullable<ReturnType<typeof clearCanvas>>,
  result: AlgorithmResult,
  visualization: CraneVisualization,
  elapsedMs: number,
  frameMessage?: string
) {
  const { context, width, height } = prepared;
  const project = createFixedOriginProjector(result.points ?? [], width, height);
  const points = (result.points ?? []).map(project);
  const base = project(visualization.base);

  context.strokeStyle = "rgba(31, 41, 51, 0.16)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(20, base.y);
  context.lineTo(width - 20, base.y);
  context.moveTo(base.x, 20);
  context.lineTo(base.x, height - 20);
  context.stroke();

  context.strokeStyle = "#116d6e";
  context.lineWidth = 6;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  points.forEach((point, index) => {
    drawPoint(context, point, index === points.length - 1 ? "#f28482" : "#0b4f50", index === points.length - 1 ? 8 : 5);
  });

  drawTreeInset(context, width, visualization);
  drawPoint(context, points[points.length - 1] ?? base, "#f28482", 8 + Math.sin(elapsedMs / 140) * 1.5);
  drawMessage(context, width, frameMessage);
}

export function getCraneScaleExtent(points: AlgorithmPoint[]) {
  if (points.length < 2) {
    return 1;
  }

  return Math.max(
    1,
    points.slice(1).reduce((total, point, index) => {
      const previous = points[index];
      return total + Math.hypot(point.x - previous.x, point.y - previous.y);
    }, 0)
  );
}

function createFixedOriginProjector(points: AlgorithmPoint[], width: number, height: number) {
  const maxDistance = getCraneScaleExtent(points);
  const padding = 44;
  const scale = Math.min((width / 2 - padding) / maxDistance, (height / 2 - padding) / maxDistance);
  const origin = { x: width / 2, y: height / 2 };

  return (point: AlgorithmPoint) => ({
    x: origin.x + point.x * scale,
    y: origin.y - point.y * scale
  });
}

function drawParticleWorld(
  prepared: NonNullable<ReturnType<typeof clearCanvas>>,
  result: AlgorithmResult,
  visualization: ParticleWorldVisualization,
  elapsedMs: number,
  frameMessage?: string
) {
  const { context, width, height } = prepared;
  const scale = Math.min((width - 56) / visualization.bounds.width, (height - 56) / visualization.bounds.height);
  const offsetX = (width - visualization.bounds.width * scale) / 2;
  const offsetY = (height - visualization.bounds.height * scale) / 2;
  const project = (point: AlgorithmPoint) => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale
  });

  context.strokeStyle = "rgba(31, 41, 51, 0.2)";
  context.lineWidth = 1;
  context.strokeRect(offsetX, offsetY, visualization.bounds.width * scale, visualization.bounds.height * scale);

  const center = project(visualization.center);
  context.strokeStyle = "rgba(242, 132, 130, 0.35)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(center.x, center.y, 18 + Math.sin(elapsedMs / 160) * 3, 0, Math.PI * 2);
  context.stroke();

  const trails = result.trails ?? [];
  trails.forEach((trail, index) => {
    const hue = (index * 41) % 360;
    context.strokeStyle = `hsla(${hue}, 62%, 38%, 0.28)`;
    context.lineWidth = 2;
    context.beginPath();
    trail.map(project).forEach((point, pointIndex) => {
      if (pointIndex === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
  });

  (result.points ?? []).forEach((point, index) => {
    const projected = project(point);
    const hue = (index * 41) % 360;
    drawPoint(context, projected, `hsl(${hue}, 58%, 42%)`, index === 0 ? 7 : 5);
  });

  drawMessage(context, width, frameMessage);
}

function drawPolyline(
  prepared: NonNullable<ReturnType<typeof clearCanvas>>,
  result: AlgorithmResult,
  progress: number,
  elapsedMs: number,
  frameMessage?: string
) {
  const { context, width, height } = prepared;
  const project = createProjector(result.points ?? [], width, height, "math");
  const projected = (result.points ?? []).map(project);
  const visiblePoints = Math.max(1, Math.ceil(projected.length * progress));
  const visibleProjected = projected.slice(0, visiblePoints);
  context.strokeStyle = "#116d6e";
  context.lineWidth = 3;
  context.beginPath();
  visibleProjected.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();

  visibleProjected.forEach((point, index) => {
    const isFinalPoint = index === projected.length - 1;
    const pulse = isFinalPoint ? Math.sin(elapsedMs / 120) * 2 : 0;
    drawPoint(context, point, isFinalPoint ? "#f28482" : "#0b4f50", isFinalPoint ? 8 + pulse : 5);
  });

  drawMessage(context, width, frameMessage);
}

function createProjector(points: AlgorithmPoint[], width: number, height: number, mode: "math" | "screen") {
  const safePoints = points.length ? points : [{ x: 0, y: 0 }];
  const xs = safePoints.map((point) => point.x);
  const ys = safePoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const padding = 42;
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const usedWidth = spanX * scale;
  const usedHeight = spanY * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;

  return (point: AlgorithmPoint) => ({
    x: (point.x - minX) * scale + offsetX,
    y:
      mode === "math"
        ? height - ((point.y - minY) * scale + offsetY)
        : (point.y - minY) * scale + offsetY
  });
}

function drawTreeInset(
  context: CanvasRenderingContext2D,
  width: number,
  visualization: CraneVisualization
) {
  const nodes = visualization.treeNodes.slice(0, 18);
  if (!nodes.length) {
    return;
  }
  const startX = Math.max(18, width - 180);
  const startY = 18;
  const levelGap = 20;
  const colGap = 22;
  context.fillStyle = "rgba(248, 250, 252, 0.88)";
  context.strokeStyle = "rgba(31, 41, 51, 0.16)";
  context.fillRect(startX - 8, startY - 8, 166, 92);
  context.strokeRect(startX - 8, startY - 8, 166, 92);
  nodes.forEach((node) => {
    const x = startX + node.start * colGap + (node.end - node.start) * colGap * 0.5;
    const y = startY + node.depth * levelGap;
    drawPoint(context, { x, y }, node.depth === 0 ? "#f28482" : "#116d6e", node.depth === 0 ? 5 : 3.5);
  });
}

function drawPoint(context: CanvasRenderingContext2D, point: AlgorithmPoint, fillStyle: string, radius: number) {
  context.fillStyle = fillStyle;
  context.beginPath();
  context.arc(point.x, point.y, Math.max(1, radius), 0, Math.PI * 2);
  context.fill();
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
