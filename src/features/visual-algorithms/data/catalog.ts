import type { AlgorithmCategory, VisualAlgorithm } from "./types";

export const categories: AlgorithmCategory[] = [
  {
    id: "reinforcement-learning",
    label: "智能体与模拟",
    description: "用网格、奖励和群体状态理解智能体或模拟系统的行为。",
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
    title: "勇者斗恶龙",
    categoryId: "reinforcement-learning",
    summary: "在随机宝剑、盾牌、巨龙和陷阱环境里观察智能体奖励学习。",
    legacyReference: "CuteBox(ME0001).html",
    resultMode: "visual-and-text",
    rendererKind: "grid-2d",
    executionMode: "auto",
    defaultState: { width: 8, height: 8, steps: 160, useQLearning: true },
    controls: [
      { id: "width", label: "宽度", kind: "integer", defaultValue: 8, constraints: { min: 4, max: 20 }, errorMessage: "宽度必须在 4 到 20 之间。" },
      { id: "height", label: "高度", kind: "integer", defaultValue: 8, constraints: { min: 4, max: 20 }, errorMessage: "高度必须在 4 到 20 之间。" },
      { id: "steps", label: "步数", kind: "integer", defaultValue: 160, constraints: { min: 10, max: 500 }, errorMessage: "步数必须在 10 到 500 之间。" },
      { id: "useQLearning", label: "Q-Learning", kind: "boolean", defaultValue: true, errorMessage: "请选择是否使用 Q-Learning。" }
    ]
  },
  {
    slug: "basketball",
    title: "投篮物理模拟",
    categoryId: "graphics-physics",
    summary: "用物理轨迹观察投篮速度、角度和命中关系。",
    legacyReference: "Basketball(ME0004).html",
    resultMode: "visual-and-text",
    rendererKind: "physics-2d",
    executionMode: "auto",
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
    executionMode: "auto",
    defaultState: { members: 24, rounds: 32 },
    controls: [
      { id: "members", label: "初始细胞", kind: "integer", defaultValue: 24, constraints: { min: 4, max: 80 }, errorMessage: "初始细胞必须在 4 到 80 之间。" },
      { id: "rounds", label: "回合数", kind: "integer", defaultValue: 32, constraints: { min: 4, max: 80 }, errorMessage: "回合数必须在 4 到 80 之间。" }
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
    executionMode: "auto",
    defaultState: { entities: 18 },
    controls: [
      { id: "entities", label: "实体数", kind: "integer", defaultValue: 18, constraints: { min: 4, max: 60 }, errorMessage: "实体数必须在 4 到 60 之间。" }
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
    executionMode: "auto",
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
    executionMode: "auto",
    updateDelayMs: 0,
    defaultState: { segments: "80,70,60,50", rotations: "0,25,-35,20" },
    controls: [
      { id: "segments", label: "线段长度", kind: "slider-list", defaultValue: "80,70,60,50", constraints: { min: 20, max: 140, step: 5 }, errorMessage: "线段长度必须为正数。" },
      { id: "rotations", label: "旋转角度", kind: "slider-list", defaultValue: "0,25,-35,20", constraints: { min: -180, max: 180, step: 1 }, errorMessage: "旋转角度必须在 -180 到 180 之间。" }
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
      { id: "grid", label: "地图", kind: "matrix", defaultValue: "W..W.\n.W...\n..WW.\n...W.", helpText: "点击小格切换水域和陆地；蓝色为水域，浅色为陆地。", errorMessage: "请输入由 W 和 . 组成的矩阵。" },
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
      { id: "grid", label: "地图", kind: "matrix", defaultValue: "S....\n.##..\n..#E.\n.....", helpText: "先选择起点、终点、障碍或空地，再点击小格编辑地图；起点和终点会保持唯一。", errorMessage: "请输入包含 S 起点和 E 终点的矩阵。" }
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
    executionMode: "auto",
    defaultState: { address: "255.255.11.135" },
    controls: [
      { id: "address", label: "数字串 / 点分候选", kind: "ip-address", defaultValue: "255.255.11.135", errorMessage: "请输入 4 到 12 位数字，可用点分形式辅助阅读。" }
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
