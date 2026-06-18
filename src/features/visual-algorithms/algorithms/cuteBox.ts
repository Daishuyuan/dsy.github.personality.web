export function runCuteBox(width: number, height: number, steps: number, useQLearning: boolean) {
  const grid = Array.from({ length: height }, () => Array(width).fill("."));
  let x = 0;
  let y = 0;
  let reward = 0;
  const path = [{ x, y }];

  for (let step = 0; step < steps; step += 1) {
    const bias = useQLearning ? step % 3 : step % 4;
    if (bias === 0 && x < width - 1) {
      x += 1;
    } else if (bias === 1 && y < height - 1) {
      y += 1;
    } else if (x > 0) {
      x -= 1;
    }
    reward += x === width - 1 && y === height - 1 ? 5 : 1;
    path.push({ x, y });
  }

  for (const point of path) {
    grid[point.y][point.x] = "*";
  }
  grid[0][0] = "S";
  grid[height - 1][width - 1] = "G";
  grid[y][x] = "A";

  return {
    grid,
    path,
    reward,
    agent: { x, y }
  };
}
