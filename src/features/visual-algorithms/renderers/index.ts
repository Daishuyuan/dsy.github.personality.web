import type { AlgorithmResult, RendererKind } from "../data/types";
import type { RendererHandle, RendererOptions } from "./renderLifecycle";
import { clearCanvas } from "./renderLifecycle";
import { renderBasketball } from "./basketballMatterRenderer";
import { renderGeometry } from "./geometryCanvasRenderer";
import { renderGrid } from "./gridCanvasRenderer";

export function renderAlgorithmCanvas(
  canvas: HTMLCanvasElement,
  rendererKind: RendererKind,
  result: AlgorithmResult,
  options: RendererOptions = {}
): RendererHandle | null {
  if (rendererKind === "grid-2d") {
    return renderGrid(canvas, result, options);
  }
  if (rendererKind === "canvas-2d") {
    return renderGeometry(canvas, result, options);
  }
  if (rendererKind === "physics-2d") {
    return renderBasketball(canvas, result, options);
  }
  clearCanvas(canvas);
  return null;
}
