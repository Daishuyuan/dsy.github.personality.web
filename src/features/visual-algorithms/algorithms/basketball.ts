import type { AlgorithmPoint, BasketballVisualization } from "../data/types";

const bounds = { width: 560, height: 420 };
const launchPoint = { x: 42, y: 360 };
export const basketballGravity = 9.8;
export const basketballSampleRate = 12;
const pixelScale = 12;
const ballRadius = 10;
const floorTop = bounds.height - 42;
const floorRestitution = 0.62;
const backboardRestitution = 0.74;
const tangentialDamping = 0.96;
const hoop = {
  rimCenter: { x: 438, y: 166 },
  rimRadius: 32,
  ballRadius,
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

export interface BasketballSample {
  point: AlgorithmPoint;
  time: number;
  velocityX: number;
  velocityY: number;
  collision: "backboard" | "floor" | null;
}

export function runBasketball(speed: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  let velocityX = speed * Math.cos(radians) * pixelScale;
  let velocityY = -speed * Math.sin(radians) * pixelScale;
  const points: AlgorithmPoint[] = [];
  const samples: BasketballSample[] = [];
  const collisions: BasketballVisualization["collisions"] = [];
  let hitPoint: AlgorithmPoint | null = null;
  let hitSampleIndex: number | null = null;
  let hitTime: number | null = null;
  let peakY = launchPoint.y;
  let point = { ...launchPoint };

  points.push(point);
  samples.push({
    point,
    time: 0,
    velocityX: velocityX / pixelScale,
    velocityY: -velocityY / pixelScale,
    collision: null
  });

  for (let step = 1; step <= 96; step += 1) {
    const time = step / basketballSampleRate;
    const previous = point;
    velocityY += basketballGravity * pixelScale / basketballSampleRate;
    point = {
      x: previous.x + velocityX / basketballSampleRate,
      y: previous.y + velocityY / basketballSampleRate
    };
    const collision = resolveCollision(previous, point, velocityX, velocityY);
    point = collision.point;
    velocityX = collision.velocityX;
    velocityY = collision.velocityY;

    if (collision.kind) {
      collisions.push({
        point,
        kind: collision.kind,
        sampleIndex: points.length
      });
    }

    if (!hitPoint) {
      const crossing = findRimCrossing(previous, point);
      if (crossing) {
        hitPoint = crossing.point;
        hitSampleIndex = points.length;
        hitTime = (step - 1 + crossing.ratio) / basketballSampleRate;
      }
    }

    peakY = Math.min(peakY, point.y);
    points.push(point);
    samples.push({
      point,
      time,
      velocityX: velocityX / pixelScale,
      velocityY: -velocityY / pixelScale,
      collision: collision.kind
    });

    if (point.y >= floorTop - ballRadius && Math.abs(velocityY) < 22 && step > 12) {
      break;
    }
    if (point.x > bounds.width + ballRadius || point.x < -ballRadius) {
      break;
    }
  }

  const hit = Boolean(hitPoint);
  const backboardCollisions = collisions.filter((collision) => collision.kind === "backboard").length;

  return {
    points,
    samples,
    metrics: {
      speed,
      angle,
      hit: hit ? "命中窗口" : "未命中",
      flightTime: samples[samples.length - 1]?.time.toFixed(2) ?? "0.00",
      peakHeight: ((launchPoint.y - peakY) / pixelScale).toFixed(2),
      hitTime: hitTime === null ? "N/A" : hitTime.toFixed(2),
      backboardCollisions,
      collisions: collisions.length,
      sampleRate: basketballSampleRate
    },
    visualization: {
      kind: "basketball",
      bounds,
      hoop,
      collisions,
      hitPoint,
      hitSampleIndex
    } satisfies BasketballVisualization
  };
}

function resolveCollision(
  previous: AlgorithmPoint,
  next: AlgorithmPoint,
  velocityX: number,
  velocityY: number
) {
  let point = next;
  let nextVelocityX = velocityX;
  let nextVelocityY = velocityY;
  let kind: "backboard" | "floor" | null = null;

  const crossedBackboard =
    velocityX > 0 &&
    previous.x + ballRadius <= hoop.backboardX &&
    next.x + ballRadius >= hoop.backboardX;

  if (crossedBackboard && Math.abs(next.x - previous.x) > 1e-9) {
    const ratio = (hoop.backboardX - ballRadius - previous.x) / (next.x - previous.x);
    const collisionY = previous.y + (next.y - previous.y) * ratio;
    if (collisionY >= hoop.backboardTop - ballRadius && collisionY <= hoop.backboardBottom + ballRadius) {
      point = {
        x: hoop.backboardX - ballRadius,
        y: collisionY
      };
      nextVelocityX = -Math.abs(velocityX) * backboardRestitution;
      nextVelocityY = velocityY * tangentialDamping;
      kind = "backboard";
    }
  }

  if (point.y + ballRadius >= floorTop) {
    point = {
      ...point,
      y: floorTop - ballRadius
    };
    nextVelocityY = -Math.abs(nextVelocityY) * floorRestitution;
    nextVelocityX *= 0.86;
    kind = kind ?? "floor";
  }

  return {
    point,
    velocityX: nextVelocityX,
    velocityY: nextVelocityY,
    kind
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
