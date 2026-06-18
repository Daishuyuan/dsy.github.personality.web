export function runBasketball(speed: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const gravity = 9.8;
  const points: Array<{ x: number; y: number }> = [];

  for (let step = 0; step <= 36; step += 1) {
    const time = step / 6;
    const x = speed * Math.cos(radians) * time;
    const y = speed * Math.sin(radians) * time - 0.5 * gravity * time ** 2;
    if (y < -8) {
      break;
    }
    points.push({ x: x * 12 + 40, y: 360 - y * 12 });
  }

  const last = points[points.length - 1] ?? { x: 0, y: 0 };
  const hit = last.x > 350 && last.x < 460 && last.y > 120 && last.y < 260;

  return {
    points,
    metrics: {
      speed,
      angle,
      hit: hit ? "命中窗口" : "未命中"
    }
  };
}
