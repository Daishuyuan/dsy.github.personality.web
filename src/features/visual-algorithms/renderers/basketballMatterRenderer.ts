import type { AlgorithmPoint, AlgorithmResult, BasketballVisualization } from "../data/types";
import type { RendererHandle, RendererOptions } from "./renderLifecycle";
import { clearCanvas, createTimedAnimation, getFrameAnimationDuration } from "./renderLifecycle";

const courtTextureSrc = "/assets/visual-algorithms/basketball/court-texture.jpg";
let courtTextureImage: HTMLImageElement | null = null;
let courtTextureLoaded = false;
let courtTextureFailed = false;

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
  const courtRect = {
    x: 0,
    y: 0,
    width,
    height
  };
  const project = (point: AlgorithmPoint) => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale
  });

  const activePoints = result.points.slice(0, Math.max(1, Math.ceil(result.points.length * progress)));
  drawCourt(context, bounds, project, scale, courtRect);
  if (visualization) {
    drawBallShadow(context, visualization, activePoints[activePoints.length - 1], project, scale);
    drawHoopStructure(context, visualization, project, scale);
  }

  drawTrajectory(context, activePoints, project, scale);

  if (visualization) {
    drawHoopFront(context, visualization, project, scale);
  }

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
  scale: number,
  rect: { x: number; y: number; width: number; height: number }
) {
  const floorTop = project({ x: 0, y: bounds.height - 42 });
  const floorHeight = Math.max(42 * scale, rect.y + rect.height - floorTop.y);
  const wallGradient = context.createLinearGradient(rect.x, rect.y, rect.x, floorTop.y);
  wallGradient.addColorStop(0, "#f8fbff");
  wallGradient.addColorStop(0.6, "#eef6f7");
  wallGradient.addColorStop(1, "#e4f0ec");
  context.fillStyle = wallGradient;
  context.fillRect(rect.x, rect.y, rect.width, Math.max(0, floorTop.y - rect.y));

  context.save();
  context.strokeStyle = "rgba(71, 85, 105, 0.12)";
  context.lineWidth = 1;
  for (let x = 40; x < bounds.width; x += 40) {
    const top = project({ x, y: 0 });
    const bottom = project({ x, y: bounds.height - 42 });
    context.beginPath();
    context.moveTo(top.x, top.y);
    context.lineTo(bottom.x, bottom.y);
    context.stroke();
  }

  for (let y = 60; y < bounds.height - 42; y += 60) {
    const left = project({ x: 0, y });
    const right = project({ x: bounds.width, y });
    context.beginPath();
    context.moveTo(left.x, left.y);
    context.lineTo(right.x, right.y);
    context.stroke();
  }
  context.restore();

  const floorGradient = context.createLinearGradient(rect.x, floorTop.y, rect.x, rect.y + rect.height);
  floorGradient.addColorStop(0, "#eab56f");
  floorGradient.addColorStop(1, "#b66a2f");
  context.fillStyle = floorGradient;
  context.fillRect(rect.x, floorTop.y, rect.width, floorHeight);

  const texture = getCourtTexture();
  if (texture) {
    context.save();
    context.globalAlpha = 0.62;
    context.drawImage(texture, rect.x, floorTop.y, rect.width, floorHeight);
    context.restore();
  } else {
    drawFallbackWood(context, rect.x, floorTop.y, rect.width, floorHeight, scale);
  }

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  context.lineWidth = Math.max(1.5, 2 * scale);
  context.beginPath();
  context.moveTo(rect.x, floorTop.y + floorHeight * 0.18);
  context.lineTo(rect.x + rect.width, floorTop.y + floorHeight * 0.18);
  context.stroke();

  context.strokeStyle = "rgba(120, 53, 15, 0.18)";
  context.lineWidth = Math.max(2, 3 * scale);
  context.beginPath();
  context.moveTo(rect.x, floorTop.y);
  context.lineTo(rect.x + rect.width, floorTop.y);
  context.stroke();
  context.restore();
}

function drawFallbackWood(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  context.save();
  for (let index = 0; index < 18; index += 1) {
    const plankX = x + (width / 18) * index;
    context.fillStyle = index % 2 === 0 ? "rgba(255, 237, 191, 0.16)" : "rgba(120, 53, 15, 0.08)";
    context.fillRect(plankX, y, width / 18, height);
  }
  context.strokeStyle = "rgba(120, 53, 15, 0.16)";
  context.lineWidth = Math.max(1, scale);
  for (let index = 1; index < 18; index += 1) {
    const plankX = x + (width / 18) * index;
    context.beginPath();
    context.moveTo(plankX, y);
    context.lineTo(plankX, y + height);
    context.stroke();
  }
  context.restore();
}

function drawHoopStructure(
  context: CanvasRenderingContext2D,
  visualization: BasketballVisualization,
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  const { hoop } = visualization;
  const backboardTop = project({ x: hoop.backboardX, y: hoop.backboardTop });
  const backboardBottom = project({ x: hoop.backboardX, y: hoop.backboardBottom });
  const windowTopLeft = project({ x: hoop.hitWindow.left, y: hoop.hitWindow.top });
  const windowBottomRight = project({ x: hoop.hitWindow.right, y: hoop.hitWindow.bottom });
  const floor = project({ x: hoop.backboardX + 18, y: visualization.bounds.height - 42 });
  const supportTop = project({ x: hoop.backboardX + 18, y: hoop.backboardTop + 14 });

  context.save();
  context.strokeStyle = "rgba(30, 41, 59, 0.18)";
  context.lineWidth = Math.max(8, 10 * scale);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(supportTop.x, supportTop.y);
  context.lineTo(floor.x, floor.y);
  context.stroke();

  context.strokeStyle = "rgba(30, 41, 59, 0.35)";
  context.lineWidth = Math.max(3, 4 * scale);
  const braceStart = project({ x: hoop.backboardX + 18, y: hoop.backboardBottom - 8 });
  const braceEnd = project({ x: hoop.backboardX, y: hoop.backboardBottom - 20 });
  context.beginPath();
  context.moveTo(braceStart.x, braceStart.y);
  context.lineTo(braceEnd.x, braceEnd.y);
  context.stroke();

  const boardX = backboardTop.x - 11 * scale;
  const boardWidth = 22 * scale;
  const boardHeight = backboardBottom.y - backboardTop.y;
  const boardGradient = context.createLinearGradient(boardX, backboardTop.y, boardX + boardWidth, backboardTop.y);
  boardGradient.addColorStop(0, "rgba(224, 242, 254, 0.24)");
  boardGradient.addColorStop(0.5, "rgba(248, 250, 252, 0.62)");
  boardGradient.addColorStop(1, "rgba(148, 163, 184, 0.34)");
  context.fillStyle = boardGradient;
  context.fillRect(boardX, backboardTop.y, boardWidth, boardHeight);

  context.strokeStyle = "rgba(51, 65, 85, 0.82)";
  context.lineWidth = Math.max(2, 2.4 * scale);
  context.strokeRect(boardX, backboardTop.y, boardWidth, boardHeight);

  context.fillStyle = "rgba(20, 184, 166, 0.08)";
  context.strokeStyle = "rgba(13, 148, 136, 0.46)";
  context.lineWidth = Math.max(1, 1.5 * scale);
  context.setLineDash([5 * scale, 5 * scale]);
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
  context.setLineDash([]);
  context.restore();
}

function drawHoopFront(
  context: CanvasRenderingContext2D,
  visualization: BasketballVisualization,
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  const { hoop } = visualization;
  const rimCenter = project(hoop.rimCenter);
  const connectorEnd = project({ x: hoop.backboardX - 8, y: hoop.rimCenter.y });

  context.save();
  context.strokeStyle = "rgba(71, 85, 105, 0.72)";
  context.lineWidth = Math.max(2, 2.2 * scale);
  context.beginPath();
  context.moveTo(connectorEnd.x, connectorEnd.y);
  context.lineTo(rimCenter.x + hoop.rimRadius * scale, rimCenter.y);
  context.stroke();

  drawNet(context, rimCenter, hoop.rimRadius * scale, scale);

  context.strokeStyle = "#f97316";
  context.lineWidth = Math.max(4, 5 * scale);
  context.lineCap = "round";
  context.beginPath();
  context.ellipse(rimCenter.x, rimCenter.y, hoop.rimRadius * scale, 10 * scale, 0, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#fb923c";
  for (const end of [-1, 1]) {
    context.beginPath();
    context.arc(
      rimCenter.x + end * hoop.rimRadius * scale,
      rimCenter.y,
      Math.max(3.5, hoop.rimTubeRadius * scale),
      0,
      Math.PI * 2
    );
    context.fill();
  }
  context.restore();
}

function drawNet(context: CanvasRenderingContext2D, rimCenter: AlgorithmPoint, rimRadius: number, scale: number) {
  const topY = rimCenter.y + 6 * scale;
  const bottomY = rimCenter.y + 42 * scale;
  const bottomRadius = rimRadius * 0.58;

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.86)";
  context.lineWidth = Math.max(1, 1.25 * scale);
  context.lineCap = "round";
  for (let index = -3; index <= 3; index += 1) {
    const topX = rimCenter.x + (rimRadius * index) / 3;
    const bottomX = rimCenter.x + (bottomRadius * index) / 3;
    context.beginPath();
    context.moveTo(topX, topY);
    context.quadraticCurveTo((topX + bottomX) / 2 + 5 * scale, (topY + bottomY) / 2, bottomX, bottomY);
    context.stroke();
  }

  for (let row = 1; row <= 3; row += 1) {
    const ratio = row / 4;
    const rowY = topY + (bottomY - topY) * ratio;
    const rowRadius = rimRadius + (bottomRadius - rimRadius) * ratio;
    context.beginPath();
    context.ellipse(rimCenter.x, rowY, rowRadius, 5 * scale, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawTrajectory(
  context: CanvasRenderingContext2D,
  points: AlgorithmPoint[],
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  if (points.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  for (let index = 1; index < points.length; index += 1) {
    const from = project(points[index - 1]);
    const to = project(points[index]);
    const progress = index / Math.max(1, points.length - 1);
    context.strokeStyle = `rgba(13, 116, 119, ${0.18 + progress * 0.64})`;
    context.lineWidth = Math.max(2.2, (2.4 + progress * 1.4) * scale);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  context.fillStyle = "rgba(13, 116, 119, 0.16)";
  for (let index = 5; index < points.length; index += 8) {
    const point = project(points[index]);
    context.beginPath();
    context.arc(point.x, point.y, Math.max(1.8, 2.4 * scale), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawBallShadow(
  context: CanvasRenderingContext2D,
  visualization: BasketballVisualization,
  point: AlgorithmPoint | undefined,
  project: (point: AlgorithmPoint) => AlgorithmPoint,
  scale: number
) {
  if (!point) {
    return;
  }

  const floorPoint = project({ x: point.x, y: visualization.bounds.height - 42 });
  const heightFromFloor = Math.max(0, visualization.bounds.height - 42 - point.y);
  const alpha = Math.max(0.08, Math.min(0.22, 0.22 - heightFromFloor / 1800));
  context.save();
  context.fillStyle = `rgba(30, 41, 59, ${alpha})`;
  context.beginPath();
  context.ellipse(floorPoint.x, floorPoint.y + 7 * scale, 16 * scale, 4.8 * scale, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
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
    context.arc(point.x, point.y, Math.max(9, 13 * scale), 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(point.x - 8 * scale, point.y);
    context.lineTo(point.x + 8 * scale, point.y);
    context.moveTo(point.x, point.y - 8 * scale);
    context.lineTo(point.x, point.y + 8 * scale);
    context.stroke();
    context.restore();
  }
}

function drawBall(context: CanvasRenderingContext2D, point: AlgorithmPoint, radius: number) {
  const gradient = context.createRadialGradient(
    point.x - radius * 0.35,
    point.y - radius * 0.45,
    radius * 0.1,
    point.x,
    point.y,
    radius
  );
  gradient.addColorStop(0, "#fed7aa");
  gradient.addColorStop(0.42, "#fb923c");
  gradient.addColorStop(1, "#c2410c");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(124, 45, 18, 0.88)";
  context.lineWidth = Math.max(1.2, radius * 0.12);
  context.stroke();

  context.save();
  context.beginPath();
  context.arc(point.x, point.y, radius * 0.92, 0, Math.PI * 2);
  context.clip();
  context.strokeStyle = "rgba(124, 45, 18, 0.72)";
  context.lineWidth = Math.max(1, radius * 0.08);
  context.beginPath();
  context.moveTo(point.x - radius, point.y);
  context.lineTo(point.x + radius, point.y);
  context.stroke();
  context.beginPath();
  context.ellipse(
    point.x - radius * 0.45,
    point.y,
    radius * 0.36,
    radius * 1.02,
    0,
    0,
    Math.PI * 2
  );
  context.stroke();
  context.beginPath();
  context.ellipse(
    point.x + radius * 0.45,
    point.y,
    radius * 0.36,
    radius * 1.02,
    0,
    0,
    Math.PI * 2
  );
  context.stroke();
  context.restore();

  context.fillStyle = "rgba(255, 247, 237, 0.72)";
  context.beginPath();
  context.arc(point.x - radius * 0.34, point.y - radius * 0.36, radius * 0.18, 0, Math.PI * 2);
  context.fill();
}

function drawMessage(context: CanvasRenderingContext2D, width: number, frameMessage?: string) {
  if (!frameMessage) {
    return;
  }
  context.save();
  const boxWidth = Math.min(260, width - 24);
  context.fillStyle = "rgba(15, 23, 42, 0.78)";
  drawRoundedRect(context, 12, 12, boxWidth, 30, 8);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "13px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(frameMessage, 24, 26);
  context.restore();
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function getCourtTexture() {
  if (courtTextureLoaded && courtTextureImage) {
    return courtTextureImage;
  }

  if (courtTextureImage || courtTextureFailed || typeof Image === "undefined") {
    return null;
  }

  courtTextureImage = new Image();
  courtTextureImage.decoding = "async";
  courtTextureImage.onload = () => {
    courtTextureLoaded = true;
  };
  courtTextureImage.onerror = () => {
    courtTextureFailed = true;
  };
  courtTextureImage.src = courtTextureSrc;
  return null;
}
