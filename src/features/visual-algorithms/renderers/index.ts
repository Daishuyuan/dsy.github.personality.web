import type { AlgorithmResult, RendererKind } from "../data/types";
import type { RendererHandle } from "./renderLifecycle";
import { clearCanvas } from "./renderLifecycle";
import { renderBasketball } from "./basketballMatterRenderer";
import { renderGeometry } from "./geometryCanvasRenderer";
import { renderGrid } from "./gridCanvasRenderer";
import { renderThreeScene } from "./threeSceneRenderer";

export function renderAlgorithmCanvas(
  canvas: HTMLCanvasElement,
  rendererKind: RendererKind,
  result: AlgorithmResult
): RendererHandle | null {
  if (rendererKind === "grid-2d") {
    renderGrid(canvas, result);
    return null;
  }
  if (rendererKind === "canvas-2d") {
    renderGeometry(canvas, result);
    return null;
  }
  if (rendererKind === "physics-2d") {
    renderBasketball(canvas, result);
    return null;
  }
  if (rendererKind === "three-dimensional") {
    return renderThreeScene(canvas, result);
  }

  clearCanvas(canvas);
  return null;
}
