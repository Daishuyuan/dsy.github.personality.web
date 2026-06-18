export function runCellWar(members: number) {
  const size = 16;
  const grid = Array.from({ length: size }, () => Array(size).fill("."));
  const teams = ["A", "B", "C", "D"];
  const counts: Record<string, number> = {};

  for (let index = 0; index < members; index += 1) {
    const team = teams[index % teams.length];
    const x = (index * 5 + team.charCodeAt(0)) % size;
    const y = (index * 7 + team.charCodeAt(0)) % size;
    grid[y][x] = team;
    counts[team] = (counts[team] ?? 0) + 1;
  }

  return { grid, counts };
}
