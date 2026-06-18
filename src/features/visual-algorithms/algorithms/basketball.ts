import type { AlgorithmPoint, BasketballVisualization } from "../data/types";

const bounds = { width: 560, height: 420 };
const launchPoint = { x: 42, y: 360 };
export const basketballGravity = 9.8;
export const basketballSampleRate = 12;
const pixelScale = 12;
const hoop = {
  rimCenter: { x: 438, y: 166 },
  rimRadius: 32,
  backboardX: 488,
  backboardTop: 96,
  backboardBottom: 198,
  hitWindow: {
    left: 402,
    top: 132,
    right: 470,
    bottom: 178
  }
};

export function runBasketball(speed: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const velocityX = speed * Math.cos(radians);
  const velocityY = speed * Math.sin(radians);
  const points: AlgorithmPoint[] = [];
  let hitPoint: AlgorithmPoint | null = null;
  let hitSampleIndex: number | null = null;
  let hitTime: number | null = null;
  let peakY = launchPoint.y;

  for (let step = 0; step <= 96; step += 1) {
    const time = step / basketballSampleRate;
    const worldX = velocityX * time;
    const worldY = velocityY * time - 0.5 * basketballGravity * time ** 2;
    const point = {
      x: launchPoint.x + worldX * pixelScale,
      y: launchPoint.y - worldY * pixelScale
    };
    if (point.y > bounds.height - 28 && step > 3) {
      break;
    }

    const previous = points[points.length - 1];
    if (!hitPoint && previous) {
      const crossing = findRimCrossing(previous, point);
      if (crossing) {
        hitPoint = crossing.point;
        hitSampleIndex = points.length;
        hitTime = (step - 1 + crossing.ratio) / basketballSampleRate;
      }
    }

    peakY = Math.min(peakY, point.y);
    points.push(point);
  }

  const hit = Boolean(hitPoint);

  return {
    points,
    metrics: {
      speed,
      angle,
      hit: hit ? "命中窗口" : "未命中",
      flightTime: ((points.length - 1) / basketballSampleRate).toFixed(2),
      peakHeight: ((launchPoint.y - peakY) / pixelScale).toFixed(2),
      hitTime: hitTime === null ? "N/A" : hitTime.toFixed(2),
      sampleRate: basketballSampleRate
    },
    visualization: {
      kind: "basketball",
      bounds,
      hoop,
      hitPoint,
      hitSampleIndex
    } satisfies BasketballVisualization
  };
}

function findRimCrossing(from: AlgorithmPoint, to: AlgorithmPoint) {
  const rimY = hoop.rimCenter.y;
  const movingDown = to.y > from.y;
  const crossesRimPlane = from.y <= rimY && to.y >= rimY;
  if (!movingDown || !crossesRimPlane || Math.abs(to.y - from.y) < 1e-9) {
    return null;
  }

  const ratio = (rimY - from.y) / (to.y - from.y);
  const point = {
    x: from.x + (to.x - from.x) * ratio,
    y: rimY
  };
  if (point.x >= hoop.hitWindow.left && point.x <= hoop.hitWindow.right) {
    return { point, ratio };
  }
  return null;
}
