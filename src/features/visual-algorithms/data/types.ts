export type AlgorithmCategoryId =
  | "reinforcement-learning"
  | "graphics-physics"
  | "data-structures-search"
  | "strings-enumeration";

export type ControlKind =
  | "number"
  | "integer"
  | "boolean"
  | "choice"
  | "text"
  | "ip-address"
  | "matrix"
  | "point-list"
  | "segment-list"
  | "slider-list";

export interface AlgorithmCategory {
  id: AlgorithmCategoryId;
  label: string;
  description: string;
  order: number;
}

export interface ControlOption {
  label: string;
  value: string | number | boolean;
}

export interface ControlConstraints {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  rows?: number;
  cols?: number;
  options?: ControlOption[];
}

export interface ControlParameter {
  id: string;
  label: string;
  kind: ControlKind;
  defaultValue: string | number | boolean;
  constraints?: ControlConstraints;
  helpText?: string;
  errorMessage: string;
}

export type ResultMode = "visual" | "text" | "visual-and-text";

export type RendererKind =
  | "grid-2d"
  | "canvas-2d"
  | "physics-2d"
  | "text-result";

export interface VisualAlgorithm {
  slug: string;
  title: string;
  categoryId: AlgorithmCategoryId;
  summary: string;
  legacyReference: string;
  controls: ControlParameter[];
  defaultState: Record<string, string | number | boolean>;
  resultMode: ResultMode;
  rendererKind: RendererKind;
  executionMode?: "manual" | "auto";
  updateDelayMs?: number;
}

export interface AlgorithmResult {
  title: string;
  summary: string;
  lines: string[];
  grid?: string[][];
  points?: Array<{ x: number; y: number }>;
  path?: Array<{ x: number; y: number }>;
  trails?: AlgorithmPoint[][];
  frames?: AlgorithmFrame[];
  metrics?: Record<string, string | number>;
  seed?: number;
  agentDirection?: GridAgentDirection;
  agentState?: GridAgentState;
  visualization?: AlgorithmVisualization;
}

export interface AlgorithmPoint {
  x: number;
  y: number;
}

export type GridAgentDirection = "center" | "up" | "right" | "down" | "left";
export type GridAgentState = "idle" | "moving" | "loot" | "blocked" | "dead" | "victory";
export type GridEventEffect =
  | "rock-break"
  | "dragon-defeat"
  | "item-pickup"
  | "shield-block"
  | "trap-trigger"
  | "dragon-attack"
  | "wall-hit"
  | "goal-reached";

export interface AlgorithmRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CircleCenterVisualization {
  kind: "circle-center";
  inputPoints: AlgorithmPoint[];
  center: AlgorithmPoint | null;
  radius: number | null;
  bisectors: Array<{
    label: string;
    midpoint: AlgorithmPoint;
    direction: AlgorithmPoint;
  }>;
}

export interface CraneVisualization {
  kind: "crane";
  base: AlgorithmPoint;
  treeNodes: Array<{
    id: string;
    start: number;
    end: number;
    x: number;
    y: number;
    depth: number;
  }>;
}

export interface ParticleWorldVisualization {
  kind: "particle-world";
  bounds: {
    width: number;
    height: number;
  };
  center: AlgorithmPoint;
}

export interface BasketballVisualization {
  kind: "basketball";
  bounds: {
    width: number;
    height: number;
  };
  hoop: {
    rimCenter: AlgorithmPoint;
    rimRadius: number;
    rimTubeRadius: number;
    ballRadius: number;
    backboardX: number;
    backboardTop: number;
    backboardBottom: number;
    hitWindow: AlgorithmRect;
  };
  collisions: Array<{
    point: AlgorithmPoint;
    kind: "backboard" | "floor" | "rim";
    sampleIndex: number;
  }>;
  hitPoint: AlgorithmPoint | null;
  hitSampleIndex: number | null;
}

export interface QLearningGridVisualization {
  kind: "q-learning-grid";
  goal: AlgorithmPoint;
  walls: AlgorithmPoint[];
}

export type AlgorithmVisualization =
  | CircleCenterVisualization
  | CraneVisualization
  | ParticleWorldVisualization
  | BasketballVisualization
  | QLearningGridVisualization;

export interface AlgorithmFrame {
  grid?: string[][];
  points?: AlgorithmPoint[];
  path?: AlgorithmPoint[];
  trails?: AlgorithmPoint[][];
  current?: AlgorithmPoint;
  frontier?: AlgorithmPoint[];
  visited?: AlgorithmPoint[];
  candidate?: AlgorithmPoint;
  phase?: string;
  explanation?: string;
  message?: string;
  metrics?: Record<string, string | number>;
  agentDirection?: GridAgentDirection;
  agentState?: GridAgentState;
  eventEffect?: GridEventEffect;
  eventPoint?: AlgorithmPoint;
  visualization?: AlgorithmVisualization;
}

export type VisualizationStatus =
  | "idle"
  | "running"
  | "complete"
  | "invalid"
  | "unsupported";

export interface VisualizationState {
  status: VisualizationStatus;
  controlValues: Record<string, string | number | boolean>;
  lastValidValues: Record<string, string | number | boolean>;
  result: AlgorithmResult | null;
  message: string;
}
