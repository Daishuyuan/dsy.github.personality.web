import type { AlgorithmFrame, AlgorithmPoint, AlgorithmResult } from "../data/types";
import { basketballSampleRate, runBasketball, type BasketballSample } from "./basketball";
import { calculateCircleCenter } from "./circleCenter";
import { runCellWar } from "./cellWar";
import { calculateCrane } from "./crane";
import { runCuteBox } from "./cuteBox";
import { findEscapePath, type EscapeTraceStep } from "./escapePathfinding";
import { countLakes } from "./lakeCounting";
import { runPerfectWorld } from "./perfectWorld";
import { splitIpAddress } from "./ipAddressSplit";

export function runAlgorithm(
  slug: string,
  values: Record<string, string | number | boolean>
): AlgorithmResult {
  if (slug === "ip-address-split") {
    const address = String(values.address);
    const digits = address.replace(/\./g, "");
    const results = splitIpAddress(digits);
    return {
      title: "IP 地址划分",
      summary: results.length === 0 ? "没有合法划分。" : `找到 ${results.length} 个合法地址。`,
      lines: results.length === 0 ? [`输入：${address}`, "无合法结果"] : [`输入：${address}`, ...results]
    };
  }

  if (slug === "lake-counting") {
    const result = countLakes(String(values.grid), Boolean(values.eightDir));
    return {
      title: "湖泊计数",
      summary: `连通块数量：${result.count}`,
      lines: [`方向模式：${values.eightDir ? "八方向" : "四方向"}`, `湖泊数量：${result.count}`],
      grid: result.grid,
      frames: buildLakeFrames(result.grid, result.visitOrder),
      metrics: { count: result.count }
    };
  }

  if (slug === "crane") {
    const result = calculateCrane(String(values.segments), String(values.rotations));
    return {
      title: "起重机",
      summary: `末端坐标：(${result.endpoint.x.toFixed(1)}, ${result.endpoint.y.toFixed(1)})`,
      lines: [
        `线段：${result.segments.join(", ")}`,
        `末端：${result.endpoint.x.toFixed(1)}, ${result.endpoint.y.toFixed(1)}`,
        `线段树节点：${result.treeNodes.length}`
      ],
      points: result.points,
      metrics: {
        segments: result.segments.length,
        treeNodes: result.treeNodes.length,
        endpointX: result.endpoint.x.toFixed(1),
        endpointY: result.endpoint.y.toFixed(1),
        rootVectorX: result.endpoint.x.toFixed(1),
        rootVectorY: result.endpoint.y.toFixed(1)
      },
      visualization: result.visualization
    };
  }

  if (slug === "escape-pathfinding") {
    const result = findEscapePath(String(values.grid));
    return {
      title: "逃逸路径搜索",
      summary: result.reachable ? `最短路径长度：${result.path.length}` : "不可达",
      lines: [result.reachable ? `找到路径，长度 ${result.path.length}` : "未找到逃逸路径"],
      grid: result.grid,
      path: result.path,
      frames: buildEscapeFrames(result.grid, result.trace, result.path)
    };
  }

  if (slug === "circle-center") {
    const result = calculateCircleCenter(String(values.points));
    return {
      title: "圆心计算",
      summary: result.center
        ? `圆心：(${result.center.x.toFixed(1)}, ${result.center.y.toFixed(1)})`
        : "三点共线，无法形成圆。",
      lines: result.center
        ? [
            `半径：${result.radius?.toFixed(1)}`,
            `圆心：${result.center.x.toFixed(1)}, ${result.center.y.toFixed(1)}`,
            `行列式：${result.determinant.toFixed(2)}`
          ]
        : ["三点共线，无法形成圆。"],
      points: result.center ? [...result.points, result.center] : result.points,
      frames: buildCircleFrames(result.points, result.center, result.radius),
      metrics: { radius: result.radius?.toFixed(2) ?? "N/A", determinant: result.determinant.toFixed(2) },
      visualization: result.visualization
    };
  }

  if (slug === "cute-box") {
    const result = runCuteBox(
      Number(values.width),
      Number(values.height),
      Number(values.steps),
      Boolean(values.useQLearning)
    );
    return {
      title: "勇者斗恶龙",
      summary: `累计奖励：${result.reward}，训练轮次：${result.episodes}`,
      lines: [
        `智能体位置：${result.agent.x}, ${result.agent.y}`,
        `累计奖励：${result.reward}`,
        `训练轮次：${result.episodes}`,
        `策略：${values.useQLearning ? "Q-Learning" : "贪心基线"}`,
        `宝剑/盾牌：${result.itemCounts.sword}/${result.itemCounts.shield}`,
        `危险物：巨龙 ${result.itemCounts.dragon}，陷阱 ${result.itemCounts.trap}，石碑 ${result.itemCounts.beam}`,
        `障碍：岩石 ${result.itemCounts.rock}`
      ],
      grid: result.grid,
      path: result.path,
      frames: result.frames,
      metrics: {
        reward: result.reward,
        episodes: result.episodes,
        swords: result.itemCounts.sword,
        shields: result.itemCounts.shield,
        dragons: result.itemCounts.dragon,
        traps: result.itemCounts.trap,
        beams: result.itemCounts.beam,
        rocks: result.itemCounts.rock
      },
      visualization: result.visualization
    };
  }

  if (slug === "cell-war") {
    const result = runCellWar(Number(values.members), Number(values.rounds));
    return {
      title: "细胞战争",
      summary: `模拟 ${values.rounds} 回合，占领 ${Object.values(result.counts).reduce((sum, count) => sum + count, 0)} 格。`,
      lines: [
        `初始细胞：${values.members}`,
        `回合数：${values.rounds}`,
        ...Object.entries(result.counts).map(([team, count]) => `${team} 阵营：${count}`)
      ],
      grid: result.grid,
      frames: result.frames,
      metrics: result.counts
    };
  }

  if (slug === "perfect-world") {
    const result = runPerfectWorld(Number(values.entities));
    return {
      title: "完美世界",
      summary: `实体数量：${values.entities}，模拟 ${result.metrics.steps} 步。`,
      lines: [
        `实体数量：${values.entities}`,
        `模拟步数：${result.metrics.steps}`,
        `边界反弹：${result.metrics.collisions}`,
        `动能：${result.metrics.kineticEnergy}`
      ],
      points: result.points,
      trails: result.trails,
      frames: result.frames,
      metrics: result.metrics,
      visualization: result.visualization
    };
  }

  if (slug === "basketball") {
    const result = runBasketball(Number(values.speed), Number(values.angle));
    return {
      title: "投篮物理模拟",
      summary: `${result.metrics.hit}，篮板碰撞 ${result.metrics.backboardCollisions} 次。`,
      lines: [
        `初速度：${values.speed}`,
        `角度：${values.angle}`,
        String(result.metrics.hit),
        `篮板碰撞：${result.metrics.backboardCollisions}`,
        `总碰撞：${result.metrics.collisions}`
      ],
      points: result.points,
      frames: buildBasketballFrames(
        result.points,
        result.samples,
        String(result.metrics.hit),
        String(result.metrics.hitTime),
        typeof result.visualization.hitSampleIndex === "number" ? result.visualization.hitSampleIndex : null
      ),
      metrics: result.metrics,
      visualization: result.visualization
    };
  }

  throw new Error(`Unknown algorithm slug: ${slug}`);
}

function cloneGrid(grid: string[][]) {
  return grid.map((row) => row.slice());
}

function buildLakeFrames(
  grid: string[][],
  visitOrder: Array<{ x: number; y: number; component: number }>
): AlgorithmFrame[] {
  const working = cloneGrid(grid);
  const visited: AlgorithmPoint[] = [];
  const frames: AlgorithmFrame[] = [
    {
      grid: cloneGrid(working),
      phase: "扫描开始",
      explanation: "从左上到右下扫描水域格，发现未访问的 W 后启动连通块搜索。",
      message: "scan start",
      metrics: { visited: 0, components: 0 }
    }
  ];
  for (const visit of visitOrder) {
    working[visit.y][visit.x] = String(visit.component);
    visited.push({ x: visit.x, y: visit.y });
    frames.push({
      grid: cloneGrid(working),
      current: { x: visit.x, y: visit.y },
      visited: visited.slice(),
      phase: "连通块扩展",
      explanation: `访问 (${visit.x}, ${visit.y})，标记为第 ${visit.component} 个湖泊的一部分。`,
      message: `visit ${visit.x},${visit.y}`,
      metrics: { visited: visited.length, components: visit.component }
    });
  }
  frames.push({
    grid: cloneGrid(working),
    visited: visited.slice(),
    phase: "计数完成",
    explanation: `扫描结束，共找到 ${Math.max(0, ...visitOrder.map((item) => item.component))} 个连通水域。`,
    message: "count complete",
    metrics: {
      visited: visited.length,
      components: Math.max(0, ...visitOrder.map((item) => item.component))
    }
  });
  return frames;
}

function buildEscapeFrames(
  grid: string[][],
  trace: EscapeTraceStep[],
  path: Array<{ x: number; y: number }>
): AlgorithmFrame[] {
  const frames: AlgorithmFrame[] = [
    {
      grid: cloneGrid(grid),
      phase: "搜索开始",
      explanation: "BFS 从 S 出发，按层扩展可达网格。",
      message: "search start",
      metrics: { visited: 1, frontier: 1 }
    }
  ];
  for (const step of trace) {
    const working = cloneGrid(grid);
    for (const visit of step.visited) {
      if (working[visit.y][visit.x] === ".") {
        working[visit.y][visit.x] = "*";
      }
    }
    for (const frontier of step.frontier) {
      if (working[frontier.y][frontier.x] === ".") {
        working[frontier.y][frontier.x] = "?";
      }
    }
    if (working[step.current.y][step.current.x] === ".") {
      working[step.current.y][step.current.x] = "@";
    }
    frames.push({
      grid: cloneGrid(working),
      current: step.current,
      frontier: step.frontier,
      visited: step.visited,
      phase: "BFS 扩展",
      explanation: `扩展 (${step.current.x}, ${step.current.y})，队列中还有 ${step.frontier.length} 个候选格。`,
      message: `expand ${step.current.x},${step.current.y}`,
      metrics: { visited: step.visited.length, frontier: step.frontier.length }
    });
  }
  for (let index = 0; index < path.length; index += 1) {
    frames.push({
      grid: cloneGrid(grid),
      path: path.slice(0, index + 1),
      current: path[index],
      phase: "路径回溯",
      explanation: `从终点反向回溯父节点，展示最短路径的前 ${index + 1} 个格。`,
      message: `path ${index + 1}`,
      metrics: { pathLength: index + 1 }
    });
  }
  return frames;
}

function buildCircleFrames(
  points: AlgorithmPoint[],
  center: AlgorithmPoint | null,
  radius: number | null
): AlgorithmFrame[] {
  const [a, b, c] = points;
  const determinant =
    2 *
    (a.x * (b.y - c.y) +
      b.x * (c.y - a.y) +
      c.x * (a.y - b.y));
  const abMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const bcMid = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
  const frames: AlgorithmFrame[] = [
    {
      points: [a],
      current: a,
      phase: "输入点 A",
      explanation: "记录第一个约束点，圆必须经过该点。",
      message: "circle point A",
      metrics: { points: 1 },
      visualization: {
        kind: "circle-center",
        inputPoints: [a],
        center: null,
        radius: null,
        bisectors: []
      }
    },
    {
      points: [a, b],
      current: b,
      phase: "输入点 B",
      explanation: "A-B 弦的垂直平分线会约束圆心位置。",
      message: "circle chord AB",
      metrics: { points: 2, chordAB: Math.hypot(a.x - b.x, a.y - b.y).toFixed(1) },
      visualization: {
        kind: "circle-center",
        inputPoints: [a, b],
        center: null,
        radius: null,
        bisectors: [buildCircleBisector("AB", a, b)]
      }
    },
    {
      points: [a, b, c],
      current: c,
      candidate: abMid,
      phase: "退化检测",
      explanation: "用三点行列式判断是否共线；行列式接近 0 时无法形成唯一圆。",
      message: "circle determinant",
      metrics: {
        points: 3,
        determinant: determinant.toFixed(2),
        abMidX: abMid.x.toFixed(1),
        bcMidX: bcMid.x.toFixed(1)
      },
      visualization: {
        kind: "circle-center",
        inputPoints: [a, b, c],
        center: null,
        radius: null,
        bisectors: [buildCircleBisector("AB", a, b), buildCircleBisector("BC", b, c)]
      }
    }
  ];

  if (center) {
    frames.push({
      points: [...points, center],
      current: center,
      candidate: bcMid,
      phase: "圆心定位",
      explanation: "两条弦的垂直平分线相交得到圆心，再由圆心到任一点距离得到半径。",
      message: "circle center",
      metrics: {
        centerX: center.x.toFixed(1),
        centerY: center.y.toFixed(1),
        radius: radius?.toFixed(1) ?? "N/A"
      },
      visualization: {
        kind: "circle-center",
        inputPoints: points,
        center,
        radius,
        bisectors: [buildCircleBisector("AB", a, b), buildCircleBisector("BC", b, c)]
      }
    });
  }

  return frames;
}

function buildBasketballFrames(
  points: AlgorithmPoint[],
  samples: BasketballSample[],
  hit: string,
  hitTime: string,
  hitSampleIndex: number | null
): AlgorithmFrame[] {
  return points.map((_, index) => {
    const sample = samples[index] ?? samples[samples.length - 1];
    const point = points[index];
    const hitReached = hitSampleIndex !== null && index >= hitSampleIndex;
    const hitStatus = hitReached || index === points.length - 1 ? hit : "检测中";
    const collisionText =
      sample?.collision === "backboard" ? "篮板反弹" : sample?.collision === "floor" ? "地面反弹" : "无";
    return {
      points: points.slice(0, index + 1),
      current: point,
      phase: sample?.collision ? "碰撞响应" : "物理积分",
      explanation: `t=${(sample?.time ?? index / basketballSampleRate).toFixed(2)}s，积分位置并检测篮板/地面碰撞。`,
      message: `shot sample ${index + 1}`,
      metrics: {
        time: (sample?.time ?? index / basketballSampleRate).toFixed(2),
        velocityX: (sample?.velocityX ?? 0).toFixed(2),
        velocityY: (sample?.velocityY ?? 0).toFixed(2),
        collision: collisionText,
        hit: hitStatus,
        hitTime: hitReached ? hitTime : "N/A"
      }
    };
  });
}

function buildCircleBisector(label: string, left: AlgorithmPoint, right: AlgorithmPoint) {
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    label,
    midpoint: {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2
    },
    direction: {
      x: -dy / length,
      y: dx / length
    }
  };
}
