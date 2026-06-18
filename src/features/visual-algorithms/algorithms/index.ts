import type { AlgorithmResult } from "../data/types";
import { runBasketball } from "./basketball";
import { calculateCircleCenter } from "./circleCenter";
import { runCellWar } from "./cellWar";
import { calculateCrane } from "./crane";
import { runCuteBox } from "./cuteBox";
import { findEscapePath } from "./escapePathfinding";
import { countLakes } from "./lakeCounting";
import { runPerfectWorld } from "./perfectWorld";
import { splitIpAddress } from "./ipAddressSplit";
import { runThreePlayground } from "./threePlayground";

export function runAlgorithm(
  slug: string,
  values: Record<string, string | number | boolean>
): AlgorithmResult {
  if (slug === "ip-address-split") {
    const results = splitIpAddress(String(values.digits));
    return {
      title: "IP 地址划分",
      summary: results.length === 0 ? "没有合法划分。" : `找到 ${results.length} 个合法地址。`,
      lines: results.length === 0 ? ["无合法结果"] : results
    };
  }

  if (slug === "lake-counting") {
    const result = countLakes(String(values.grid), Boolean(values.eightDir));
    return {
      title: "湖泊计数",
      summary: `连通块数量：${result.count}`,
      lines: [`方向模式：${values.eightDir ? "八方向" : "四方向"}`, `湖泊数量：${result.count}`],
      grid: result.grid,
      metrics: { count: result.count }
    };
  }

  if (slug === "crane") {
    const result = calculateCrane(String(values.segments), String(values.rotations));
    return {
      title: "起重机",
      summary: `末端坐标：(${result.endpoint.x.toFixed(1)}, ${result.endpoint.y.toFixed(1)})`,
      lines: [`线段：${result.segments.join(", ")}`, `末端：${result.endpoint.x.toFixed(1)}, ${result.endpoint.y.toFixed(1)}`],
      points: result.points
    };
  }

  if (slug === "escape-pathfinding") {
    const result = findEscapePath(String(values.grid));
    return {
      title: "逃逸路径搜索",
      summary: result.reachable ? `最短路径长度：${result.path.length}` : "不可达",
      lines: [result.reachable ? `找到路径，长度 ${result.path.length}` : "未找到逃逸路径"],
      grid: result.grid,
      path: result.path
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
        ? [`半径：${result.radius?.toFixed(1)}`, `圆心：${result.center.x.toFixed(1)}, ${result.center.y.toFixed(1)}`]
        : ["三点共线，无法形成圆。"],
      points: result.center ? [...result.points, result.center] : result.points,
      metrics: { radius: result.radius?.toFixed(2) ?? "N/A" }
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
      title: "可爱小方块",
      summary: `累计奖励：${result.reward}`,
      lines: [`智能体位置：${result.agent.x}, ${result.agent.y}`, `累计奖励：${result.reward}`],
      grid: result.grid,
      path: result.path
    };
  }

  if (slug === "cell-war") {
    const result = runCellWar(Number(values.members));
    return {
      title: "细胞战争",
      summary: `细胞总数：${values.members}`,
      lines: Object.entries(result.counts).map(([team, count]) => `${team} 阵营：${count}`),
      grid: result.grid,
      metrics: result.counts
    };
  }

  if (slug === "perfect-world") {
    const result = runPerfectWorld(Number(values.entities));
    return {
      title: "完美世界",
      summary: `实体数量：${values.entities}`,
      lines: [`实体数量：${values.entities}`, `环数：${result.metrics.rings}`],
      points: result.points,
      metrics: result.metrics
    };
  }

  if (slug === "basketball") {
    const result = runBasketball(Number(values.speed), Number(values.angle));
    return {
      title: "投篮物理模拟",
      summary: String(result.metrics.hit),
      lines: [`初速度：${values.speed}`, `角度：${values.angle}`, String(result.metrics.hit)],
      points: result.points,
      metrics: result.metrics
    };
  }

  if (slug === "three-js-playground") {
    const result = runThreePlayground(Number(values.objects), Boolean(values.helper));
    return {
      title: "Three.js 可视化",
      summary: `${values.objects} 个对象`,
      lines: [`对象数：${values.objects}`, String(result.metrics.helper)],
      points: result.points,
      metrics: result.metrics
    };
  }

  throw new Error(`Unknown algorithm slug: ${slug}`);
}
