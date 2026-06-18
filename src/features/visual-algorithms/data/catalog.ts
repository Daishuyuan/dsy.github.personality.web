import type { AlgorithmCategory, VisualAlgorithm } from "./types";

export const categories: AlgorithmCategory[] = [
  {
    id: "reinforcement-learning",
    label: "强化学习",
    description: "用可视化状态、奖励和策略变化理解智能体行为。",
    order: 1
  },
  {
    id: "graphics-physics",
    label: "图形与物理",
    description: "几何、图形引擎、三维场景和物理运动的互动展示。",
    order: 2
  },
  {
    id: "data-structures-search",
    label: "数据结构与搜索",
    description: "线段树、连通块、路径搜索等结构化算法过程。",
    order: 3
  },
  {
    id: "strings-enumeration",
    label: "字符串与枚举",
    description: "通过枚举和约束校验生成合法结果。",
    order: 4
  }
];

export const algorithms: VisualAlgorithm[] = [
  {
    slug: "cute-box",
    title: "可爱小方块",
    categoryId: "reinforcement-learning",
    summary: "在网格世界里观察智能体移动、奖励累计和策略变化。",
    legacyReference: "CuteBox(ME0001).html",
    resultMode: "visual-and-text",
    rendererKind: "grid-2d",
    defaultState: { width: 8, height: 8, steps: 80, useQLearning: true },
    controls: [
      { id: "width", label: "宽度", kind: "integer", defaultValue: 8, constraints: { min: 4, max: 20 }, errorMessage: "宽度必须在 4 到 20 之间。" },
      { id: "height", label: "高度", kind: "integer", defaultValue: 8, constraints: { min: 4, max: 20 }, errorMessage: "高度必须在 4 到 20 之间。" },
      { id: "steps", label: "步数", kind: "integer", defaultValue: 80, constraints: { min: 10, max: 500 }, errorMessage: "步数必须在 10 到 500 之间。" },
      { id: "useQLearning", label: "Q-Learning", kind: "boolean", defaultValue: true, errorMessage: "请选择是否使用 Q-Learning。" }
    ]
  },
  {
    slug: "basketball",
    title: "投篮物理模拟",
    categoryId: "reinforcement-learning",
    summary: "用物理轨迹观察投篮速度、角度和命中关系。",
    legacyReference: "Basketball(ME0004).html",
    resultMode: "visual-and-text",
    rendererKind: "physics-2d",
    defaultState: { speed: 18, angle: 52 },
    controls: [
      { id: "speed", label: "初速度", kind: "number", defaultValue: 18, constraints: { min: 5, max: 40, step: 1 }, errorMessage: "初速度必须在 5 到 40 之间。" },
      { id: "angle", label: "角度", kind: "number", defaultValue: 52, constraints: { min: 10, max: 80, step: 1 }, errorMessage: "角度必须在 10 到 80 之间。" }
    ]
  },
  {
    slug: "cell-war",
    title: "细胞战争",
    categoryId: "reinforcement-learning",
    summary: "观察多个细胞阵营在空间中扩张、碰撞和占领。",
    legacyReference: "CellWar(ME0005).html",
    resultMode: "visual-and-text",
    rendererKind: "grid-2d",
    defaultState: { members: 24 },
    controls: [
      { id: "members", label: "细胞数量", kind: "integer", defaultValue: 24, constraints: { min: 4, max: 80 }, errorMessage: "细胞数量必须在 4 到 80 之间。" }
    ]
  },
  {
    slug: "perfect-world",
    title: "完美世界",
    categoryId: "graphics-physics",
    summary: "以二维图形场景展示实体运动、边界和简单世界状态。",
    legacyReference: "Perfect(ME0003).html",
    resultMode: "visual-and-text",
    rendererKind: "canvas-2d",
    defaultState: { entities: 18 },
    controls: [
      { id: "entities", label: "实体数", kind: "integer", defaultValue: 18, constraints: { min: 4, max: 60 }, errorMessage: "实体数必须在 4 到 60 之间。" }
    ]
  },
  {
    slug: "three-js-playground",
    title: "Three.js 可视化",
    categoryId: "graphics-physics",
    summary: "展示可旋转三维对象、辅助网格和场景状态。",
    legacyReference: "ThreeJsTest(ME0002).html",
    resultMode: "visual-and-text",
    rendererKind: "three-dimensional",
    defaultState: { objects: 5, helper: true },
    controls: [
      { id: "objects", label: "对象数", kind: "integer", defaultValue: 5, constraints: { min: 1, max: 12 }, errorMessage: "对象数必须在 1 到 12 之间。" },
      { id: "helper", label: "显示辅助线", kind: "boolean", defaultValue: true, errorMessage: "请选择是否显示辅助线。" }
    ]
  },
  {
    slug: "circle-center",
    title: "圆心计算",
    categoryId: "graphics-physics",
    summary: "通过三点计算圆心，并展示退化点集的处理结果。",
    legacyReference: "CircleCenter(ME0008).html",
    resultMode: "visual-and-text",
    rendererKind: "canvas-2d",
    defaultState: { points: "80,300;250,80;410,300" },
    controls: [
      { id: "points", label: "三点坐标", kind: "point-list", defaultValue: "80,300;250,80;410,300", errorMessage: "请输入 3 个点，格式如 80,300;250,80;410,300。" }
    ]
  },
  {
    slug: "crane",
    title: "起重机",
    categoryId: "data-structures-search",
    summary: "用线段序列和角度更新理解分段结构的末端位置。",
    legacyReference: "Crane(POJ2991).html",
    resultMode: "visual-and-text",
    rendererKind: "canvas-2d",
    defaultState: { segments: "80,70,60,50", rotations: "0,25,-35,20" },
    controls: [
      { id: "segments", label: "线段长度", kind: "segment-list", defaultValue: "80,70,60,50", errorMessage: "请输入正数线段，格式如 80,70,60,50。" },
      { id: "rotations", label: "旋转角度", kind: "segment-list", defaultValue: "0,25,-35,20", errorMessage: "请输入角度列表，格式如 0,25,-35,20。" }
    ]
  },
  {
    slug: "lake-counting",
    title: "湖泊计数",
    categoryId: "data-structures-search",
    summary: "在字符网格中计算水域连通块数量。",
    legacyReference: "LakeCounting(POJ2386).html",
    resultMode: "visual-and-text",
    rendererKind: "grid-2d",
    defaultState: { grid: "W..W.\n.W...\n..WW.\n...W.", eightDir: true },
    controls: [
      { id: "grid", label: "地图", kind: "matrix", defaultValue: "W..W.\n.W...\n..WW.\n...W.", errorMessage: "请输入由 W 和 . 组成的矩阵。" },
      { id: "eightDir", label: "八方向", kind: "boolean", defaultValue: true, errorMessage: "请选择是否使用八方向。" }
    ]
  },
  {
    slug: "escape-pathfinding",
    title: "逃逸路径搜索",
    categoryId: "data-structures-search",
    summary: "在障碍网格里搜索从 S 到 E 的最短路径。",
    legacyReference: "Escape(ME0007).html",
    resultMode: "visual-and-text",
    rendererKind: "grid-2d",
    defaultState: { grid: "S....\n.##..\n..#E.\n....." },
    controls: [
      { id: "grid", label: "地图", kind: "matrix", defaultValue: "S....\n.##..\n..#E.\n.....", errorMessage: "请输入包含 S 起点和 E 终点的矩阵。" }
    ]
  },
  {
    slug: "ip-address-split",
    title: "IP 地址划分",
    categoryId: "strings-enumeration",
    summary: "枚举无点数字串可以形成的合法 IPv4 地址。",
    legacyReference: "IpAddressSplit(ME0006).html",
    resultMode: "text",
    rendererKind: "text-result",
    defaultState: { digits: "25525511135" },
    controls: [
      { id: "digits", label: "数字串", kind: "text", defaultValue: "25525511135", constraints: { pattern: "^[0-9]{4,12}$" }, errorMessage: "请输入 4 到 12 位数字。" }
    ]
  }
];

export function getAlgorithmsByCategory() {
  return categories
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      category,
      algorithms: algorithms.filter((algorithm) => algorithm.categoryId === category.id)
    }));
}

export function getAlgorithmBySlug(slug: string) {
  return algorithms.find((algorithm) => algorithm.slug === slug);
}

export function getAlgorithmSlugs() {
  return algorithms.map((algorithm) => algorithm.slug);
}
