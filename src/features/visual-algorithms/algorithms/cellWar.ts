import type { AlgorithmFrame } from "../data/types";

export interface CellWarResult {
  grid: string[][];
  frames: AlgorithmFrame[];
  counts: Record<string, number>;
}

const teams = ["A", "B", "C", "D"];
const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 }
];

export function runCellWar(members: number, rounds: number): CellWarResult {
  const size = 16;
  let grid = createEmptyGrid(size);
  const frames: CellWarResult["frames"] = [];

  for (let index = 0; index < members; index += 1) {
    const team = teams[index % teams.length];
    const position = findOpenPosition(grid, index, team);
    grid[position.y][position.x] = team;
  }

  frames.push({
    grid: cloneGrid(grid),
    phase: "初始化",
    explanation: `${members} 个初始细胞按阵营落位，后续每一回合根据邻域影响力扩张或争夺。`,
    message: "day 0: seed cells",
    metrics: { day: 0, ...countTeams(grid) }
  });

  for (let day = 1; day <= rounds; day += 1) {
    const nextGrid = evolve(grid, day);
    frames.push({
      grid: cloneGrid(nextGrid),
      phase: "扩张与争夺",
      explanation: `第 ${day} 回合：空格可能被相邻阵营占领，弱势阵营格可能被更强邻域影响力替换。`,
      message: `day ${day}: expand and contest`,
      metrics: { day, ...countTeams(nextGrid) }
    });
    grid = nextGrid;
  }

  return {
    grid,
    frames,
    counts: countTeams(grid)
  };
}

function createEmptyGrid(size: number) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "."));
}

function cloneGrid(grid: string[][]) {
  return grid.map((row) => row.slice());
}

function findOpenPosition(grid: string[][], index: number, team: string) {
  const size = grid.length;
  const seed = team.charCodeAt(0);
  let x = (index * 5 + seed) % size;
  let y = (index * 7 + Math.floor(index / teams.length) * 3 + seed) % size;

  for (let attempt = 0; attempt < size * size; attempt += 1) {
    if (grid[y][x] === ".") {
      return { x, y };
    }
    x = (x + 3) % size;
    y = (y + 5 + Math.floor((x + attempt) / size)) % size;
  }

  return { x: 0, y: 0 };
}

function evolve(grid: string[][], day: number) {
  const size = grid.length;
  const nextGrid = cloneGrid(grid);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const influence = countNeighborInfluence(grid, x, y);
      const winner = getWinningTeam(influence, x, y, day);
      if (!winner) {
        continue;
      }

      const current = grid[y][x];
      if (current === ".") {
        const teamIndex = teams.indexOf(winner);
        if ((x + y + day + teamIndex) % 3 !== 0 || influence[winner] >= 2) {
          nextGrid[y][x] = winner;
        }
      } else if (current !== winner) {
        const currentSupport = influence[current] ?? 0;
        if (influence[winner] >= currentSupport + 2) {
          nextGrid[y][x] = winner;
        }
      }
    }
  }

  return nextGrid;
}

function countNeighborInfluence(grid: string[][], x: number, y: number) {
  const size = grid.length;
  const influence: Record<string, number> = {};

  for (const direction of directions) {
    const nextX = (x + direction.x + size) % size;
    const nextY = (y + direction.y + size) % size;
    const team = grid[nextY][nextX];
    if (team !== ".") {
      influence[team] = (influence[team] ?? 0) + 1;
    }
  }

  return influence;
}

function getWinningTeam(influence: Record<string, number>, x: number, y: number, day: number) {
  return teams
    .map((team, index) => ({
      team,
      score: influence[team] ?? 0,
      tieBreak: (x * 13 + y * 17 + day * 19 + index * 23) % 29
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.tieBreak - left.tieBreak)[0]?.team;
}

function countTeams(grid: string[][]) {
  const counts = Object.fromEntries(teams.map((team) => [team, 0]));
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== ".") {
        counts[cell] = (counts[cell] ?? 0) + 1;
      }
    }
  }
  return counts;
}
