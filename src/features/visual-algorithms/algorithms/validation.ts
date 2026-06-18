import type { ControlParameter } from "../data/types";

export interface ValidationSuccess {
  ok: true;
  values: Record<string, string | number | boolean>;
}

export interface ValidationFailure {
  ok: false;
  message: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function parseNumberList(value: string): number[] {
  const parts = value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("请输入至少一个数值。");
  }

  return parts.map((part) => {
    const parsed = Number(part);
    if (!Number.isFinite(parsed)) {
      throw new Error(`无法解析数值 ${part}。`);
    }
    return parsed;
  });
}

export function parseMatrix(value: string): string[][] {
  const rows = value
    .trim()
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length === 0) {
    throw new Error("矩阵不能为空。");
  }

  const width = rows[0].length;
  if (width === 0 || rows.some((row) => row.length !== width)) {
    throw new Error("矩阵每一行长度必须一致。");
  }

  return rows.map((row) => row.split(""));
}

export function parsePoints(value: string): Array<{ x: number; y: number }> {
  const points = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [xText, yText] = part.split(",").map((item) => item.trim());
      const x = Number(xText);
      const y = Number(yText);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`无法解析坐标 ${part}。`);
      }
      return { x, y };
    });

  if (points.length < 2) {
    throw new Error("请输入至少两个点。");
  }

  return points;
}

export function validateControls(
  controls: ControlParameter[],
  values: Record<string, string | number | boolean>
): ValidationResult {
  const normalized: Record<string, string | number | boolean> = {};

  for (const control of controls) {
    const value = values[control.id] ?? control.defaultValue;

    try {
      if (control.kind === "integer" || control.kind === "number") {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return { ok: false, message: control.errorMessage };
        }
        if (control.kind === "integer" && !Number.isInteger(numeric)) {
          return { ok: false, message: control.errorMessage };
        }
        if (control.constraints?.min !== undefined && numeric < control.constraints.min) {
          return { ok: false, message: control.errorMessage };
        }
        if (control.constraints?.max !== undefined && numeric > control.constraints.max) {
          return { ok: false, message: control.errorMessage };
        }
        normalized[control.id] = numeric;
      } else if (control.kind === "boolean") {
        normalized[control.id] = Boolean(value);
      } else if (control.kind === "segment-list") {
        parseNumberList(String(value));
        normalized[control.id] = String(value);
      } else if (control.kind === "matrix") {
        parseMatrix(String(value));
        normalized[control.id] = String(value);
      } else if (control.kind === "point-list") {
        parsePoints(String(value));
        normalized[control.id] = String(value);
      } else if (control.kind === "text") {
        const text = String(value).trim();
        if (control.constraints?.pattern && !new RegExp(control.constraints.pattern).test(text)) {
          return { ok: false, message: control.errorMessage };
        }
        normalized[control.id] = text;
      } else {
        normalized[control.id] = value;
      }
    } catch {
      return { ok: false, message: control.errorMessage };
    }
  }

  return { ok: true, values: normalized };
}
