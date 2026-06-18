import type {
  AlgorithmFrame,
  AlgorithmPoint,
  GridAgentDirection,
  GridAgentState,
  GridEventEffect,
  QLearningGridVisualization
} from "../data/types";

type ActionId = Exclude<GridAgentDirection, "center">;
type CellKind = "." | "R" | "T" | "B" | "D" | "K" | "H";

interface Action {
  id: ActionId;
  label: string;
  dx: number;
  dy: number;
}

interface QTableEntry {
  up: number;
  right: number;
  down: number;
  left: number;
}

interface AdventureWorld {
  width: number;
  height: number;
  start: AlgorithmPoint;
  goal: AlgorithmPoint;
  cells: CellKind[][];
  itemCounts: Record<string, number>;
}

interface Inventory {
  sword: boolean;
  shield: boolean;
}

interface EpisodeState {
  agent: AlgorithmPoint;
  inventory: Inventory;
  clearedKeys: Set<string>;
  path: AlgorithmPoint[];
  episode: number;
}

interface Transition {
  next: AlgorithmPoint;
  inventory: Inventory;
  clearedKeys: Set<string>;
  reward: number;
  terminal: boolean;
  event: string;
  cell: string;
  agentState: GridAgentState;
  eventEffect?: GridEventEffect;
  eventPoint?: AlgorithmPoint;
}

const actions: Action[] = [
  { id: "up", label: "上", dx: 0, dy: -1 },
  { id: "right", label: "右", dx: 1, dy: 0 },
  { id: "down", label: "下", dx: 0, dy: 1 },
  { id: "left", label: "左", dx: -1, dy: 0 }
];

const alpha = 0.32;
const gamma = 0.9;

export interface CuteBoxResult {
  grid: string[][];
  path: AlgorithmPoint[];
  frames: AlgorithmFrame[];
  reward: number;
  agent: AlgorithmPoint;
  episodes: number;
  itemCounts: Record<string, number>;
  visualization: QLearningGridVisualization;
}

export function runCuteBox(width: number, height: number, steps: number, useQLearning: boolean): CuteBoxResult {
  const seed = width * 73856093 + height * 19349663 + steps * 83492791 + (useQLearning ? 17 : 31);
  const random = seededRandom(seed);
  const world = buildAdventureWorld(width, height, random);
  const qTable = new Map<string, QTableEntry>();

  let state = createInitialEpisodeState(world, 1);
  let totalReward = 0;
  const allVisited: AlgorithmPoint[] = [state.agent];
  const frames: AlgorithmFrame[] = [
    {
      grid: buildGrid(world, state, [state.agent]),
      path: state.path.slice(),
      current: state.agent,
      phase: useQLearning ? "Q 表初始化" : "贪心基线初始化",
      explanation: useQLearning
        ? "状态包含位置、是否持有宝剑、是否持有盾牌；同一格子会因库存不同而得到不同价值。"
        : "关闭 Q-Learning 时使用只看终点距离的贪心基线，作为复杂奖励环境下的对照。",
      message: "cute-box start",
      agentDirection: "center",
      agentState: "idle",
      metrics: {
        step: 0,
        episode: state.episode,
        reward: 0,
        totalReward: 0,
        inventory: formatInventory(state.inventory),
        policy: useQLearning ? "Q-Learning" : "Greedy",
        swords: world.itemCounts.sword,
        shields: world.itemCounts.shield,
        dangers: world.itemCounts.dragon + world.itemCounts.trap + world.itemCounts.beam
      }
    }
  ];

  for (let step = 1; step <= steps; step += 1) {
    const epsilon = useQLearning ? Math.max(0.04, 0.48 - (step / Math.max(steps, 1)) * 0.38) : 0;
    const stateKey = getStateKey(state);
    const action = useQLearning
      ? chooseEpsilonGreedy(qTable, stateKey, epsilon, random, world, state)
      : chooseGreedyAction(world, state);
    const transition = move(world, state, action);
    const oldValue = getQ(qTable, stateKey)[action.id];
    const nextState = {
      ...state,
      agent: transition.next,
      inventory: transition.inventory,
      clearedKeys: transition.clearedKeys,
      path: [...state.path, transition.next]
    };
    const nextStateKey = getStateKey(nextState);
    const nextBest = transition.terminal ? 0 : maxQ(getQ(qTable, nextStateKey));
    const updatedValue = useQLearning ? oldValue + alpha * (transition.reward + gamma * nextBest - oldValue) : oldValue;

    if (useQLearning) {
      setQ(qTable, stateKey, action.id, updatedValue);
    }

    totalReward += transition.reward;
    allVisited.push(transition.next);

    frames.push({
      grid: buildGrid(world, nextState, nextState.path),
      path: nextState.path.slice(),
      current: transition.next,
      phase: transition.terminal ? "人生结束" : useQLearning ? "TD 更新" : "贪心移动",
      explanation: buildExplanation(action, transition, useQLearning),
      message: `step ${step}`,
      agentDirection: action.id,
      agentState: transition.agentState,
      eventEffect: transition.eventEffect,
      eventPoint: transition.eventPoint,
      metrics: {
        step,
        episode: state.episode,
        action: action.label,
        cell: transition.cell,
        event: transition.event,
        reward: transition.reward.toFixed(1),
        totalReward: totalReward.toFixed(1),
        epsilon: epsilon.toFixed(2),
        oldQ: oldValue.toFixed(2),
        updatedQ: updatedValue.toFixed(2),
        bestNextQ: nextBest.toFixed(2),
        inventory: formatInventory(transition.inventory),
        status: labelAgentState(transition.agentState),
        state: stateKey
      }
    });

    state = transition.terminal
      ? createInitialEpisodeState(world, state.episode + 1)
      : nextState;
  }

  return {
    grid: buildGrid(world, state, allVisited),
    path: allVisited,
    frames,
    reward: Number(totalReward.toFixed(1)),
    agent: state.agent,
    episodes: state.episode,
    itemCounts: world.itemCounts,
    agentDirection: "center",
    agentState: "idle",
    visualization: {
      kind: "q-learning-grid",
      goal: world.goal,
      walls: collectCells(world, new Set(["R", "T", "B", "D"]))
    }
  };
}

function buildAdventureWorld(width: number, height: number, random: () => number): AdventureWorld {
  const safeWidth = Math.max(4, Math.floor(width));
  const safeHeight = Math.max(4, Math.floor(height));
  const start = { x: 0, y: 0 };
  const goal = { x: safeWidth - 1, y: safeHeight - 1 };
  const cells = Array.from({ length: safeHeight }, () => Array.from({ length: safeWidth }, () => "." as CellKind));
  const reserved = new Set([
    pointKey(start),
    pointKey(goal),
    pointKey({ x: 1, y: 0 }),
    pointKey({ x: 0, y: 1 }),
    pointKey({ x: safeWidth - 2, y: safeHeight - 1 }),
    pointKey({ x: safeWidth - 1, y: safeHeight - 2 })
  ]);

  for (let y = 0; y < safeHeight; y += 1) {
    for (let x = 0; x < safeWidth; x += 1) {
      if (reserved.has(pointKey({ x, y }))) {
        continue;
      }

      const roll = random();
      if (roll < 0.11) {
        cells[y][x] = "R";
      } else if (roll < 0.21) {
        cells[y][x] = "T";
      } else if (roll < 0.28) {
        cells[y][x] = "B";
      } else if (roll < 0.35) {
        cells[y][x] = "D";
      } else if (roll < 0.41) {
        cells[y][x] = "K";
      } else if (roll < 0.46) {
        cells[y][x] = "H";
      }
    }
  }

  placeRequired(cells, random, "K", reserved);
  placeRequired(cells, random, "H", reserved);
  placeRequired(cells, random, "D", reserved);
  placeRequired(cells, random, "R", reserved);
  placeRequired(cells, random, "T", reserved);
  placeRequired(cells, random, "B", reserved);

  cells[start.y][start.x] = ".";
  cells[goal.y][goal.x] = ".";

  return {
    width: safeWidth,
    height: safeHeight,
    start,
    goal,
    cells,
    itemCounts: countItems(cells)
  };
}

function placeRequired(cells: CellKind[][], random: () => number, kind: CellKind, reserved: Set<string>) {
  if (cells.some((row) => row.includes(kind))) {
    return;
  }

  const empty = collectEmptyCells(cells, reserved);
  const selected = empty[Math.floor(random() * empty.length)] ?? empty[0];
  if (selected) {
    cells[selected.y][selected.x] = kind;
  }
}

function collectEmptyCells(cells: CellKind[][], reserved: Set<string>) {
  const empty: AlgorithmPoint[] = [];
  for (let y = 0; y < cells.length; y += 1) {
    for (let x = 0; x < (cells[0]?.length ?? 0); x += 1) {
      if (!reserved.has(pointKey({ x, y })) && cells[y][x] === ".") {
        empty.push({ x, y });
      }
    }
  }
  return empty;
}

function createInitialEpisodeState(world: AdventureWorld, episode: number): EpisodeState {
  return {
    agent: world.start,
    inventory: { sword: false, shield: false },
    clearedKeys: new Set<string>(),
    path: [world.start],
    episode
  };
}

function move(world: AdventureWorld, state: EpisodeState, action: Action): Transition {
  const attempted = { x: state.agent.x + action.dx, y: state.agent.y + action.dy };
  const outside = attempted.x < 0 || attempted.x >= world.width || attempted.y < 0 || attempted.y >= world.height;
  if (outside) {
    return {
      next: state.agent,
      inventory: state.inventory,
      clearedKeys: state.clearedKeys,
      reward: -120,
      terminal: true,
      event: "撞墙",
      cell: "边界",
      agentState: "dead",
      eventEffect: "wall-hit",
      eventPoint: state.agent
    };
  }

  const nextKey = pointKey(attempted);
  const rawCell = pointEquals(attempted, world.goal) ? "G" : world.cells[attempted.y][attempted.x];
  const cell = state.clearedKeys.has(nextKey) ? "." : rawCell;

  if (cell === "G") {
    return resolveMove(state, attempted, 100, true, "找到公主", "公主", {}, false, "victory", "goal-reached");
  }
  if (cell === "K") {
    return resolveMove(state, attempted, 20, false, "拿到宝剑", "宝剑", { sword: true }, true, "loot", "item-pickup");
  }
  if (cell === "H") {
    return resolveMove(state, attempted, 10, false, "拿到盾牌", "盾牌", { shield: true }, true, "loot", "item-pickup");
  }
  if (cell === "R") {
    return resolveMove(
      state,
      attempted,
      state.inventory.sword ? 5 : -10,
      false,
      state.inventory.sword ? "斩碎岩石" : "费力碎岩",
      "岩石",
      {},
      true,
      state.inventory.sword ? "moving" : "blocked",
      state.inventory.sword ? "rock-break" : "wall-hit"
    );
  }
  if (cell === "T") {
    return resolveMove(state, attempted, -100, true, "掉进陷阱", "陷阱", {}, false, "dead", "trap-trigger");
  }
  if (cell === "B") {
    return state.inventory.shield
      ? resolveMove(state, attempted, 5, false, "盾牌挡住石碑", "石碑", {}, true, "blocked", "shield-block")
      : resolveMove(state, attempted, -50, true, "被石碑击败", "石碑", {}, false, "dead", "trap-trigger");
  }
  if (cell === "D") {
    if (state.inventory.sword && state.inventory.shield) {
      return resolveMove(state, attempted, 40, false, "装备齐全屠龙", "巨龙", {}, true, "moving", "dragon-defeat");
    }
    if (state.inventory.sword) {
      return resolveMove(state, attempted, 12, false, "用宝剑击败巨龙", "巨龙", {}, true, "moving", "dragon-defeat");
    }
    if (state.inventory.shield) {
      return resolveMove(state, state.agent, -5, false, "有盾但暂避巨龙", "巨龙", {}, false, "blocked", "shield-block", attempted);
    }
    return resolveMove(state, attempted, -80, true, "被巨龙击败", "巨龙", {}, false, "dead", "dragon-attack");
  }

  return resolveMove(state, attempted, -1, false, "继续探索", "空地", {}, false, "moving");
}

function resolveMove(
  state: EpisodeState,
  next: AlgorithmPoint,
  reward: number,
  terminal: boolean,
  event: string,
  cell: string,
  inventoryPatch: Partial<Inventory> = {},
  clearCell = false,
  agentState: GridAgentState = terminal ? "dead" : "moving",
  eventEffect?: GridEventEffect,
  eventPoint: AlgorithmPoint = next
): Transition {
  const nextInventory = { ...state.inventory, ...inventoryPatch };
  const nextClearedKeys = clearCell ? new Set([...state.clearedKeys, pointKey(next)]) : state.clearedKeys;
  return {
    next,
    inventory: nextInventory,
    clearedKeys: nextClearedKeys,
    reward,
    terminal,
    event,
    cell,
    agentState,
    eventEffect,
    eventPoint
  };
}

function buildGrid(world: AdventureWorld, state: EpisodeState, path: AlgorithmPoint[]) {
  const grid = world.cells.map((row, y) =>
    row.map((cell, x) => (state.clearedKeys.has(pointKey({ x, y })) ? "." : cell))
  );

  for (const point of path) {
    if (grid[point.y]?.[point.x] === ".") {
      grid[point.y][point.x] = "*";
    }
  }

  grid[world.start.y][world.start.x] = "S";
  grid[world.goal.y][world.goal.x] = "G";
  grid[state.agent.y][state.agent.x] = "A";
  return grid;
}

function chooseEpsilonGreedy(
  qTable: Map<string, QTableEntry>,
  stateKey: string,
  epsilon: number,
  random: () => number,
  world: AdventureWorld,
  state: EpisodeState
) {
  if (random() < epsilon) {
    return actions[Math.floor(random() * actions.length)] ?? actions[0];
  }
  const entry = getQ(qTable, stateKey);
  return actions
    .slice()
    .sort((left, right) => {
      const qDiff = entry[right.id] - entry[left.id];
      if (Math.abs(qDiff) > 1e-9) {
        return qDiff;
      }
      const leftNext = move(world, state, left).next;
      const rightNext = move(world, state, right).next;
      return manhattan(leftNext, world.goal) - manhattan(rightNext, world.goal);
    })[0];
}

function chooseGreedyAction(world: AdventureWorld, state: EpisodeState) {
  return actions
    .slice()
    .sort((left, right) => {
      const leftNext = move(world, state, left).next;
      const rightNext = move(world, state, right).next;
      return manhattan(leftNext, world.goal) - manhattan(rightNext, world.goal);
    })[0];
}

function buildExplanation(action: Action, transition: Transition, useQLearning: boolean) {
  const prefix = `执行动作“${action.label}”：${transition.event}，即时奖励 ${transition.reward}。`;
  if (!useQLearning) {
    return `${prefix} 贪心基线只看离公主的距离，不能系统性学习道具改变后的风险收益。`;
  }
  return `${prefix} Q-Learning 用当前状态、库存和下一状态最大 Q 值更新动作价值。`;
}

function getQ(qTable: Map<string, QTableEntry>, stateKey: string): QTableEntry {
  const existing = qTable.get(stateKey);
  if (existing) {
    return existing;
  }
  const created = { up: 0, right: 0, down: 0, left: 0 };
  qTable.set(stateKey, created);
  return created;
}

function setQ(qTable: Map<string, QTableEntry>, stateKey: string, action: ActionId, value: number) {
  const entry = getQ(qTable, stateKey);
  qTable.set(stateKey, { ...entry, [action]: value });
}

function maxQ(entry: QTableEntry) {
  return Math.max(entry.up, entry.right, entry.down, entry.left);
}

function getStateKey(state: EpisodeState) {
  return `${pointKey(state.agent)}|K${state.inventory.sword ? 1 : 0}|H${state.inventory.shield ? 1 : 0}`;
}

function formatInventory(inventory: Inventory) {
  const items = [
    inventory.sword ? "宝剑" : "",
    inventory.shield ? "盾牌" : ""
  ].filter(Boolean);
  return items.length ? items.join("+") : "无";
}

function labelAgentState(agentState: GridAgentState) {
  if (agentState === "dead") return "死亡";
  if (agentState === "victory") return "胜利";
  if (agentState === "loot") return "拾取";
  if (agentState === "blocked") return "受阻";
  if (agentState === "moving") return "移动";
  return "待命";
}

function countItems(cells: CellKind[][]) {
  const counts = { rock: 0, trap: 0, beam: 0, dragon: 0, sword: 0, shield: 0 };
  for (const cell of cells.flat()) {
    if (cell === "R") counts.rock += 1;
    if (cell === "T") counts.trap += 1;
    if (cell === "B") counts.beam += 1;
    if (cell === "D") counts.dragon += 1;
    if (cell === "K") counts.sword += 1;
    if (cell === "H") counts.shield += 1;
  }
  return counts;
}

function collectCells(world: AdventureWorld, kinds: Set<string>) {
  const points: AlgorithmPoint[] = [];
  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      if (kinds.has(world.cells[y][x])) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function pointKey(point: AlgorithmPoint) {
  return `${point.x},${point.y}`;
}

function pointEquals(left: AlgorithmPoint, right: AlgorithmPoint) {
  return left.x === right.x && left.y === right.y;
}

function manhattan(left: AlgorithmPoint, right: AlgorithmPoint) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}
