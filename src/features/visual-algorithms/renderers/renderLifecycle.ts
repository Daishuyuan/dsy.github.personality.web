export interface RendererHandle {
  cleanup: () => void;
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
