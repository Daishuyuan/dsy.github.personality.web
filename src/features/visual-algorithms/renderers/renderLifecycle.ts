export interface RendererHandle {
  cleanup: () => void;
}

export interface RendererOptions {
  frameIndex?: number;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || canvas.clientWidth || 640));
  const height = Math.max(260, Math.floor(rect.height || canvas.clientHeight || 420));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height };
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  const { width, height } = resizeCanvasToDisplaySize(canvas);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  return { context, width, height };
}

export function createAnimationLoop(render: () => void): RendererHandle {
  let frame = 0;
  const tick = () => {
    render();
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);

  return {
    cleanup: () => {
      window.cancelAnimationFrame(frame);
    }
  };
}

export function createTimedAnimation(
  durationMs: number,
  render: (progress: number, elapsedMs: number) => void
): RendererHandle {
  let frame = 0;
  let stopped = false;
  const startedAt = window.performance.now();

  const tick = (now: number) => {
    if (stopped) {
      return;
    }

    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    render(progress, elapsed);

    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
    }
  };

  render(0, 0);
  frame = window.requestAnimationFrame(tick);

  return {
    cleanup: () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
    }
  };
}

export function getFrameAnimationDuration(
  frameCount: number | undefined,
  options: { minMs?: number; maxMs?: number; perFrameMs?: number } = {}
) {
  const minMs = options.minMs ?? 1800;
  const maxMs = options.maxMs ?? 6500;
  const perFrameMs = options.perFrameMs ?? 110;
  const safeFrameCount = Math.max(1, frameCount ?? 1);
  return Math.min(maxMs, Math.max(minMs, safeFrameCount * perFrameMs));
}
