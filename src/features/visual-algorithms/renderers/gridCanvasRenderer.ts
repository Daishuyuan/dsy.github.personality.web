import type { AlgorithmResult } from "../data/types";
import type { RendererHandle, RendererOptions } from "./renderLifecycle";
import { clearCanvas, createTimedAnimation, getFrameAnimationDuration } from "./renderLifecycle";

type DragonQuestAssetKey =
  | "grass"
  | "start"
  | "hero-center"
  | "hero-up"
  | "hero-right"
  | "hero-down"
  | "hero-left"
  | "hero-dead"
  | "hero-victory"
  | "hero-hurt"
  | "hero-loot"
  | "princess"
  | "sword"
  | "shield"
  | "dragon"
  | "rock"
  | "trap"
  | "monument"
  | "effect-rock-break"
  | "effect-dragon-defeat"
  | "effect-item-pickup"
  | "effect-shield-block"
  | "effect-trap-trigger"
  | "effect-dragon-attack"
  | "effect-wall-hit"
  | "effect-goal-reached";

const dragonQuestAssetBase = "/assets/visual-algorithms/dragon-quest";
const dragonQuestAssetPaths: Record<DragonQuestAssetKey, string> = {
  grass: `${dragonQuestAssetBase}/grass.svg`,
  start: `${dragonQuestAssetBase}/start.svg`,
  "hero-center": `${dragonQuestAssetBase}/hero-center.svg`,
  "hero-up": `${dragonQuestAssetBase}/hero-up.svg`,
  "hero-right": `${dragonQuestAssetBase}/hero-right.svg`,
  "hero-down": `${dragonQuestAssetBase}/hero-down.svg`,
  "hero-left": `${dragonQuestAssetBase}/hero-left.svg`,
  "hero-dead": `${dragonQuestAssetBase}/hero-dead.svg`,
  "hero-victory": `${dragonQuestAssetBase}/hero-victory.svg`,
  "hero-hurt": `${dragonQuestAssetBase}/hero-hurt.svg`,
  "hero-loot": `${dragonQuestAssetBase}/hero-loot.svg`,
  princess: `${dragonQuestAssetBase}/princess.svg`,
  sword: `${dragonQuestAssetBase}/sword.svg`,
  shield: `${dragonQuestAssetBase}/shield.svg`,
  dragon: `${dragonQuestAssetBase}/dragon.svg`,
  rock: `${dragonQuestAssetBase}/rock.svg`,
  trap: `${dragonQuestAssetBase}/trap.svg`,
  monument: `${dragonQuestAssetBase}/monument.svg`,
  "effect-rock-break": `${dragonQuestAssetBase}/effect-rock-break.svg`,
  "effect-dragon-defeat": `${dragonQuestAssetBase}/effect-dragon-defeat.svg`,
  "effect-item-pickup": `${dragonQuestAssetBase}/effect-item-pickup.svg`,
  "effect-shield-block": `${dragonQuestAssetBase}/effect-shield-block.svg`,
  "effect-trap-trigger": `${dragonQuestAssetBase}/effect-trap-trigger.svg`,
  "effect-dragon-attack": `${dragonQuestAssetBase}/effect-dragon-attack.svg`,
  "effect-wall-hit": `${dragonQuestAssetBase}/effect-wall-hit.svg`,
  "effect-goal-reached": `${dragonQuestAssetBase}/effect-goal-reached.svg`
};

const dragonQuestImages = createDragonQuestImages();
const legendItemWidth = 64;
const legendRowHeight = 28;
const canvasInset = 12;

export function renderGrid(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  options: RendererOptions = {}
): RendererHandle | null {
  if (!result.grid) {
    clearCanvas(canvas);
    return null;
  }

  if (options.frameIndex !== undefined && result.frames?.length) {
    drawGridFrame(canvas, result, options.frameIndex);
    return null;
  }

  return createTimedAnimation(getFrameAnimationDuration(result.frames?.length, { maxMs: 8000 }), (progress) => {
    if (result.frames?.length) {
      const frameIndex = Math.min(result.frames.length - 1, Math.floor(progress * result.frames.length));
      drawGridFrame(canvas, result, frameIndex);
    } else {
      drawGrid(canvas, result, progress);
    }
  });
}

function drawGridFrame(canvas: HTMLCanvasElement, result: AlgorithmResult, frameIndex: number) {
  const frame = result.frames?.[Math.max(0, Math.min(frameIndex, result.frames.length - 1))];
  if (!frame) {
    drawGrid(canvas, result, 1);
    return;
  }

  drawGrid(
    canvas,
    {
      ...result,
      grid: frame.grid ?? result.grid,
      path: frame.path ?? result.path,
      agentDirection: frame.agentDirection ?? result.agentDirection,
      agentState: frame.agentState ?? result.agentState,
      eventEffect: frame.eventEffect,
      eventPoint: frame.eventPoint
    },
    1,
    frame.message
  );
}

function drawGrid(
  canvas: HTMLCanvasElement,
  result: AlgorithmResult,
  progress: number,
  frameMessage?: string
) {
  const prepared = clearCanvas(canvas);
  if (!prepared || !result.grid) {
    return;
  }

  const { context, width, height } = prepared;
  const rows = result.grid.length;
  const cols = result.grid[0]?.length ?? 1;
  const useDragonQuestSprites = result.visualization?.kind === "q-learning-grid";
  const legendEntries = getLegendEntries(width, result.grid);
  const topReserved = getGridTopReservedHeight(width, legendEntries, Boolean(frameMessage));
  const availableHeight = Math.max(160, height - topReserved - canvasInset);
  const cell = Math.min(width / cols, availableHeight / rows);
  const offsetX = (width - cell * cols) / 2;
  const offsetY = topReserved + (availableHeight - cell * rows) / 2;
  const pathKeys = new Set((result.path ?? []).map((point) => `${point.x},${point.y}`));
  const totalCells = rows * cols;
  const visibleCells = Math.max(1, Math.ceil(totalCells * Math.min(progress, 0.82) / 0.82));
  const visiblePath = Math.max(0, Math.floor((result.path?.length ?? 0) * progress));
  const visiblePathKeys = new Set(
    (result.path ?? []).slice(0, visiblePath).map((point) => `${point.x},${point.y}`)
  );

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const flatIndex = row * cols + col;
      const cellVisible = flatIndex < visibleCells;
      const value = result.grid[row][col];
      const x = offsetX + col * cell;
      const y = offsetY + row * cell;
      const key = `${col},${row}`;
      const inPath = pathKeys.has(key) && visiblePathKeys.has(key);
      if (cellVisible && useDragonQuestSprites) {
        const eventHere = pointMatches(result.eventPoint, col, row);
        drawDragonQuestCell(context, result, value, x, y, cell, inPath, eventHere);
        context.strokeStyle = "rgba(15, 23, 42, 0.22)";
        context.strokeRect(x, y, cell, cell);
        continue;
      }
      context.fillStyle = cellVisible ? colorForCell(value, inPath) : "rgba(217, 226, 236, 0.32)";
      context.fillRect(x, y, cell, cell);
      context.strokeStyle = "rgba(31, 41, 51, 0.16)";
      context.strokeRect(x, y, cell, cell);
      if (cellVisible && cell > 18 && value !== ".") {
        context.fillStyle = "#1f2933";
        context.font = `${Math.max(11, cell * 0.34)}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(value, x + cell / 2, y + cell / 2);
      }
    }
  }

  const legendY = frameMessage ? canvasInset + legendRowHeight + 6 : canvasInset;
  if (frameMessage) {
    drawFrameMessage(context, width, frameMessage, canvasInset);
  }
  drawLegend(context, width, legendEntries, useDragonQuestSprites, legendY);
}

function getGridTopReservedHeight(width: number, entries: LegendEntry[], hasFrameMessage: boolean) {
  const legendRows = getLegendRows(width, entries);
  const legendHeight = legendRows > 0 ? legendRows * legendRowHeight : 0;
  const messageHeight = hasFrameMessage ? legendRowHeight + 6 : 0;
  const topPadding = legendHeight || messageHeight ? canvasInset : 0;
  return topPadding + messageHeight + legendHeight + (legendHeight || messageHeight ? canvasInset : 0);
}

interface LegendEntry {
  value: string;
  label: string;
}

function getLegendEntries(width: number, grid: string[][]): LegendEntry[] {
  const maxEntries = getLegendMaxEntries(width);
  const values = Array.from(new Set(grid.flat())).filter((value) => value !== ".");
  return values
    .map((value) => ({ value, label: labelForCell(value) }))
    .filter((entry) => entry.label)
    .slice(0, maxEntries);
}

function getLegendMaxEntries(width: number) {
  return Math.max(2, Math.floor((width - canvasInset * 2 - 16) / legendItemWidth));
}

function getLegendRows(width: number, entries: LegendEntry[]) {
  if (!entries.length) {
    return 0;
  }
  return Math.ceil(entries.length / getLegendMaxEntries(width));
}

function drawLegend(
  context: CanvasRenderingContext2D,
  width: number,
  entries: LegendEntry[],
  useDragonQuestSprites = false,
  startY = canvasInset
) {
  if (!entries.length) {
    return;
  }

  const maxEntries = getLegendMaxEntries(width);
  const rowCount = getLegendRows(width, entries);
  const legendWidth = Math.min(width - canvasInset * 2, Math.min(entries.length, maxEntries) * legendItemWidth + 16);
  const startX = canvasInset;
  context.fillStyle = "rgba(248, 250, 252, 0.9)";
  context.fillRect(startX, startY, legendWidth, rowCount * legendRowHeight);
  context.strokeStyle = "rgba(31, 41, 51, 0.12)";
  context.strokeRect(startX, startY, legendWidth, rowCount * legendRowHeight);

  entries.forEach((entry, index) => {
    const row = Math.floor(index / maxEntries);
    const col = index % maxEntries;
    const x = startX + 10 + col * legendItemWidth;
    const y = startY + row * legendRowHeight;
    const legendAsset = useDragonQuestSprites ? assetForGridValue(entry.value, "center", "idle") : null;
    if (legendAsset && drawTileImage(context, legendAsset, x - 1, y + 5, 18)) {
      context.strokeStyle = "rgba(31, 41, 51, 0.18)";
      context.strokeRect(x - 1, y + 5, 18, 18);
    } else {
      context.fillStyle = colorForCell(entry.value, false);
      context.fillRect(x, y + 8, 12, 12);
      context.strokeStyle = "rgba(31, 41, 51, 0.18)";
      context.strokeRect(x, y + 8, 12, 12);
    }
    context.fillStyle = "#1f2933";
    context.font = "11px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(entry.label, x + 23, y + 14);
  });
}

function drawFrameMessage(context: CanvasRenderingContext2D, width: number, frameMessage: string, y: number) {
  const boxWidth = Math.min(220, width - canvasInset * 2);
  context.fillStyle = "rgba(31, 41, 51, 0.78)";
  context.fillRect(canvasInset, y, boxWidth, 28);
  context.fillStyle = "#ffffff";
  context.font = "13px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(frameMessage, canvasInset + 12, y + 14);
}

function drawDragonQuestCell(
  context: CanvasRenderingContext2D,
  result: AlgorithmResult,
  value: string,
  x: number,
  y: number,
  cell: number,
  inPath: boolean,
  eventHere: boolean
) {
  context.fillStyle = "#7fcf4f";
  context.fillRect(x, y, cell, cell);
  drawTileImage(context, "grass", x, y, cell);

  if (inPath || value === "*") {
    context.fillStyle = "rgba(250, 204, 21, 0.24)";
    context.fillRect(x + cell * 0.12, y + cell * 0.12, cell * 0.76, cell * 0.76);
  }

  const assetKey = assetForGridValue(
    value,
    result.agentDirection ?? "center",
    result.agentState ?? "idle"
  );
  if (assetKey && drawTileImage(context, assetKey, x, y, cell)) {
    if (eventHere) {
      drawDragonQuestEventEffect(context, result, x, y, cell);
    }
    return;
  }

  if (value !== "." && value !== "*") {
    context.fillStyle = colorForCell(value, inPath);
    context.fillRect(x + cell * 0.16, y + cell * 0.16, cell * 0.68, cell * 0.68);
    context.fillStyle = "#1f2933";
    context.font = `${Math.max(11, cell * 0.34)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(value, x + cell / 2, y + cell / 2);
  }

  if (eventHere) {
    drawDragonQuestEventEffect(context, result, x, y, cell);
  }
}

function drawDragonQuestEventEffect(
  context: CanvasRenderingContext2D,
  result: AlgorithmResult,
  x: number,
  y: number,
  cell: number
) {
  const assetKey = effectAssetForEvent(result.eventEffect);
  if (!assetKey) {
    return;
  }
  drawTileImage(context, assetKey, x, y, cell);
}

function effectAssetForEvent(eventEffect: AlgorithmResult["eventEffect"]): DragonQuestAssetKey | null {
  if (eventEffect === "rock-break") return "effect-rock-break";
  if (eventEffect === "dragon-defeat") return "effect-dragon-defeat";
  if (eventEffect === "item-pickup") return "effect-item-pickup";
  if (eventEffect === "shield-block") return "effect-shield-block";
  if (eventEffect === "trap-trigger") return "effect-trap-trigger";
  if (eventEffect === "dragon-attack") return "effect-dragon-attack";
  if (eventEffect === "wall-hit") return "effect-wall-hit";
  if (eventEffect === "goal-reached") return "effect-goal-reached";
  return null;
}

function pointMatches(point: AlgorithmResult["eventPoint"], x: number, y: number) {
  return point?.x === x && point.y === y;
}

function assetForGridValue(
  value: string,
  agentDirection: AlgorithmResult["agentDirection"],
  agentState: AlgorithmResult["agentState"]
): DragonQuestAssetKey | null {
  if (value === "S") return "start";
  if (value === "G" || value === "E") return "princess";
  if (value === "K") return "sword";
  if (value === "H") return "shield";
  if (value === "D") return "dragon";
  if (value === "R" || value === "#") return "rock";
  if (value === "T") return "trap";
  if (value === "B") return "monument";
  if (value !== "A") return null;

  if (agentState === "dead") return "hero-dead";
  if (agentState === "victory") return "hero-victory";
  if (agentState === "loot") return "hero-loot";
  if (agentState === "blocked") return "hero-hurt";
  if (agentDirection === "up") return "hero-up";
  if (agentDirection === "right") return "hero-right";
  if (agentDirection === "down") return "hero-down";
  if (agentDirection === "left") return "hero-left";
  return "hero-center";
}

function drawTileImage(
  context: CanvasRenderingContext2D,
  assetKey: DragonQuestAssetKey,
  x: number,
  y: number,
  size: number
) {
  const image = dragonQuestImages[assetKey];
  if (!image?.complete || image.naturalWidth === 0) {
    return false;
  }

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(image, x, y, size, size);
  context.restore();
  return true;
}

function createDragonQuestImages() {
  if (typeof Image === "undefined") {
    return {} as Partial<Record<DragonQuestAssetKey, HTMLImageElement>>;
  }

  return Object.fromEntries(
    Object.entries(dragonQuestAssetPaths).map(([key, path]) => {
      const image = new Image();
      image.src = path;
      return [key, image];
    })
  ) as Partial<Record<DragonQuestAssetKey, HTMLImageElement>>;
}

function labelForCell(value: string) {
  if (value === "S") return "起点";
  if (value === "E") return "终点";
  if (value === "G") return "目标";
  if (value === "A") return "智能体";
  if (value === "#") return "障碍";
  if (value === "R") return "岩石";
  if (value === "T") return "陷阱";
  if (value === "B") return "石碑";
  if (value === "D") return "巨龙";
  if (value === "K") return "宝剑";
  if (value === "H") return "盾牌";
  if (value === "*") return "已访问";
  if (value === "?") return "队列";
  if (value === "@") return "当前";
  if (value.toUpperCase() === "W") return "水域";
  if (/^[1-9]$/.test(value)) return `湖 ${value}`;
  if (/^[A-D]$/.test(value)) return `${value} 阵营`;
  return value;
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
  if (value === "R") {
    return "#64748b";
  }
  if (value === "T") {
    return "#b91c1c";
  }
  if (value === "B") {
    return "#7c3aed";
  }
  if (value === "D") {
    return "#dc2626";
  }
  if (value === "K") {
    return "#38bdf8";
  }
  if (value === "H") {
    return "#22c55e";
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
  if (value === "?") {
    return "#ffd166";
  }
  if (value === "@") {
    return "#f4a261";
  }
  if (/^[1-9]$/.test(value)) {
    return {
      "1": "#78c6d8",
      "2": "#74c69d",
      "3": "#f9c74f",
      "4": "#f28482",
      "5": "#90be6d",
      "6": "#43aa8b",
      "7": "#577590",
      "8": "#f3722c",
      "9": "#b5179e"
    }[value] ?? "#78c6d8";
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
