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
  | "matrix"
  | "point-list"
  | "segment-list";

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
  | "three-dimensional"
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
}

export interface AlgorithmResult {
  title: string;
  summary: string;
  lines: string[];
  grid?: string[][];
  points?: Array<{ x: number; y: number }>;
  path?: Array<{ x: number; y: number }>;
  metrics?: Record<string, string | number>;
  seed?: number;
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
