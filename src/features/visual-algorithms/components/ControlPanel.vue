<template>
  <ElForm class="va-controls" label-position="top">
    <ElFormItem
      v-for="control in controls"
      :key="control.id"
      :label="control.label"
      class="va-control-item"
    >
      <ElSlider
        v-if="isBoundedNumeric(control)"
        :model-value="Number(modelValue[control.id])"
        :min="control.constraints?.min"
        :max="control.constraints?.max"
        :step="control.constraints?.step ?? 1"
        show-input
        :show-input-controls="false"
        @update:model-value="(value) => updateValue(control.id, Number(value))"
      />
      <ElInputNumber
        v-else-if="control.kind === 'integer' || control.kind === 'number'"
        :model-value="Number(modelValue[control.id])"
        :min="control.constraints?.min"
        :max="control.constraints?.max"
        :step="control.constraints?.step ?? 1"
        controls-position="right"
        @update:model-value="(value) => updateValue(control.id, value ?? control.defaultValue)"
      />
      <ElSwitch
        v-else-if="control.kind === 'boolean'"
        :model-value="Boolean(modelValue[control.id])"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <ElSelect
        v-else-if="control.kind === 'choice'"
        :model-value="modelValue[control.id]"
        @update:model-value="(value) => updateValue(control.id, value)"
      >
        <ElOption
          v-for="option in control.constraints?.options ?? []"
          :key="String(option.value)"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <div v-else-if="control.kind === 'ip-address'" class="va-ip-editor">
        <ElInput
          class="va-ip-digits"
          :model-value="String(modelValue[control.id] ?? '')"
          placeholder="25525511135 或 255.255.11.135"
          aria-label="IP 数字串"
          @update:model-value="(value) => updateValue(control.id, value)"
        />
        <div class="va-ip-control" aria-label="点分候选编辑">
          <template
            v-for="(segment, index) in getIpSegments(modelValue[control.id])"
            :key="`${control.id}-${index}`"
          >
            <ElInputNumber
              :model-value="Number(segment)"
              :min="0"
              :max="255"
              :step="1"
              :controls="false"
              @update:model-value="(value) => updateIpSegment(control.id, index, value ?? 0)"
            />
            <span v-if="index < 3" class="va-ip-dot">.</span>
          </template>
        </div>
      </div>
      <div v-else-if="control.kind === 'slider-list'" class="va-slider-list">
        <div
          v-for="(value, index) in getSliderValues(modelValue[control.id])"
          :key="`${control.id}-${index}`"
          class="va-slider-row"
        >
          <span>{{ getSliderLabel(control.id, index) }}</span>
          <ElSlider
            :model-value="value"
            :min="control.constraints?.min ?? 0"
            :max="control.constraints?.max ?? 100"
            :step="control.constraints?.step ?? 1"
            show-input
            :show-input-controls="false"
            @input="(nextValue) => updateSliderValue(control.id, index, Number(nextValue))"
            @update:model-value="(nextValue) => updateSliderValue(control.id, index, Number(nextValue))"
          />
        </div>
      </div>
      <div v-else-if="control.kind === 'point-list'" class="va-point-list">
        <div
          v-for="(point, index) in getPointValues(modelValue[control.id])"
          :key="`${control.id}-${index}`"
          class="va-point-row"
        >
          <span>点 {{ index + 1 }}</span>
          <ElInputNumber
            :model-value="point.x"
            :controls="false"
            @update:model-value="(value) => updatePointValue(control.id, index, 'x', value ?? 0)"
          />
          <ElInputNumber
            :model-value="point.y"
            :controls="false"
            @update:model-value="(value) => updatePointValue(control.id, index, 'y', value ?? 0)"
          />
        </div>
      </div>
      <div
        v-else-if="control.kind === 'matrix' && isPathMatrixControl(control)"
        class="va-path-matrix-editor"
      >
        <div class="va-path-mode" role="radiogroup" aria-label="地图编辑模式">
          <button
            v-for="mode in pathModes"
            :key="mode.value"
            type="button"
            class="va-path-mode-button"
            :class="{ 'is-active': pathPaintMode === mode.value }"
            :aria-pressed="pathPaintMode === mode.value"
            @click="pathPaintMode = mode.value"
          >
            {{ mode.label }}
          </button>
        </div>
        <div
          class="va-path-grid"
          role="grid"
          aria-label="逃逸路径地图点选编辑"
          :style="{ gridTemplateColumns: `repeat(${getPathMatrixColumnCount(modelValue[control.id], control)}, minmax(0, 1fr))` }"
        >
          <button
            v-for="cell in getPathMatrixCells(modelValue[control.id], control)"
            :key="`${control.id}-${cell.row}-${cell.col}`"
            type="button"
            class="va-path-cell"
            :class="`is-${getPathCellClass(cell.value)}`"
            :aria-label="`第 ${cell.row + 1} 行第 ${cell.col + 1} 列，${getPathCellLabel(cell.value)}，点击设为${getPathCellLabel(pathPaintMode)}`"
            @click="setPathCell(control, cell.row, cell.col)"
          >
            <span>{{ cell.value }}</span>
          </button>
        </div>
        <div class="va-path-legend" aria-hidden="true">
          <span><i class="is-start" />起点</span>
          <span><i class="is-end" />终点</span>
          <span><i class="is-wall" />障碍</span>
          <span><i />空地</span>
        </div>
      </div>
      <div
        v-else-if="control.kind === 'matrix' && isWaterMatrixControl(control)"
        class="va-lake-matrix-editor"
      >
        <div
          class="va-lake-grid"
          role="grid"
          aria-label="湖泊地图点选编辑"
          :style="{ gridTemplateColumns: `repeat(${getWaterMatrixColumnCount(modelValue[control.id], control)}, minmax(0, 1fr))` }"
        >
          <button
            v-for="cell in getWaterMatrixCells(modelValue[control.id], control)"
            :key="`${control.id}-${cell.row}-${cell.col}`"
            type="button"
            class="va-lake-cell"
            :class="{ 'is-water': cell.value === 'W' }"
            :aria-label="`第 ${cell.row + 1} 行第 ${cell.col + 1} 列，${cell.value === 'W' ? '水域' : '陆地'}，点击切换`"
            @click="toggleWaterCell(control, cell.row, cell.col)"
          >
            <span>{{ cell.value === "W" ? "W" : "." }}</span>
          </button>
        </div>
        <div class="va-lake-legend" aria-hidden="true">
          <span><i class="is-water" />水域</span>
          <span><i />陆地</span>
        </div>
      </div>
      <ElInput
        v-else-if="control.kind === 'matrix'"
        :model-value="String(modelValue[control.id] ?? '')"
        type="textarea"
        :rows="5"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <ElInput
        v-else
        :model-value="String(modelValue[control.id] ?? '')"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <p v-if="control.helpText" class="va-help">{{ control.helpText }}</p>
    </ElFormItem>
    <div class="va-control-actions">
      <ElButton type="primary" @click="$emit('run')">
        {{ props.executionMode === "auto" ? "重播" : "运行" }}
      </ElButton>
      <ElButton @click="$emit('reset')">重置</ElButton>
    </div>
  </ElForm>
</template>

<script setup lang="ts">
import "element-plus/dist/index.css";
import { ref } from "vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSlider,
  ElSwitch
} from "element-plus";
import { splitIpAddress } from "../algorithms/ipAddressSplit";
import type { ControlParameter } from "../data/types";

type PathCellValue = "." | "#" | "S" | "E";

const props = defineProps<{
  controls: ControlParameter[];
  modelValue: Record<string, string | number | boolean>;
  executionMode?: "manual" | "auto";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string | number | boolean>];
  run: [];
  reset: [];
}>();

const pathPaintMode = ref<PathCellValue>("#");
const pathModes: Array<{ value: PathCellValue; label: string }> = [
  { value: "#", label: "障碍" },
  { value: ".", label: "空地" },
  { value: "S", label: "起点" },
  { value: "E", label: "终点" }
];

function updateValue(id: string, value: string | number | boolean) {
  emit("update:modelValue", {
    ...props.modelValue,
    [id]: value
  });
}

function isBoundedNumeric(control: ControlParameter) {
  return (
    (control.kind === "integer" || control.kind === "number") &&
    control.constraints?.min !== undefined &&
    control.constraints?.max !== undefined
  );
}

function getSliderValues(value: string | number | boolean | undefined) {
  return String(value ?? "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));
}

function updateSliderValue(id: string, index: number, value: number) {
  const nextValues = getSliderValues(props.modelValue[id]).map((part, partIndex) =>
    partIndex === index ? value : part
  );
  updateValue(id, nextValues.join(","));
}

function getSliderLabel(id: string, index: number) {
  return id === "rotations" ? `关节 ${index + 1}` : `第 ${index + 1} 段`;
}

function getIpSegments(value: string | number | boolean | undefined) {
  const input = String(value ?? "0.0.0.0").trim();
  const dotted = input.includes(".") ? input : splitIpAddress(input)[0] ?? splitDigitsForDisplay(input);
  const parts = dotted.split(".");
  return Array.from({ length: 4 }, (_, index) => parts[index] ?? "0");
}

function splitDigitsForDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  if (digits.length === 0) {
    return "0.0.0.0";
  }
  return [
    digits.slice(0, 3) || "0",
    digits.slice(3, 6) || "0",
    digits.slice(6, 9) || "0",
    digits.slice(9, 12) || "0"
  ].join(".");
}

function updateIpSegment(id: string, index: number, value: number) {
  const nextSegments = getIpSegments(props.modelValue[id]).map((segment, segmentIndex) =>
    segmentIndex === index ? String(value) : segment
  );
  updateValue(id, nextSegments.join("."));
}

function getPointValues(value: string | number | boolean | undefined) {
  return String(value ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [xText, yText] = part.split(",").map((item) => item.trim());
      return {
        x: Number(xText) || 0,
        y: Number(yText) || 0
      };
    });
}

function updatePointValue(id: string, index: number, axis: "x" | "y", value: number) {
  const nextPoints = getPointValues(props.modelValue[id]).map((point, pointIndex) =>
    pointIndex === index ? { ...point, [axis]: value } : point
  );
  updateValue(id, nextPoints.map((point) => `${point.x},${point.y}`).join(";"));
}

function isWaterMatrixControl(control: ControlParameter) {
  return control.kind === "matrix" && /^[Ww.\n\s]+$/.test(String(control.defaultValue));
}

function isPathMatrixControl(control: ControlParameter) {
  const defaultValue = String(control.defaultValue);
  return control.kind === "matrix" && /^[SE#.\n\s]+$/.test(defaultValue) && defaultValue.includes("S") && defaultValue.includes("E");
}

function getWaterMatrixRows(value: string | number | boolean | undefined, control: ControlParameter) {
  const fallback = String(control.defaultValue);
  const text = String(value ?? fallback).trim() || fallback;
  const rawRows = text
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);
  const rows = rawRows.length > 0 ? rawRows : fallback.split(/\n+/);
  const width = Math.max(1, ...rows.map((row) => row.length));

  return rows.map((row) =>
    Array.from({ length: width }, (_, index) => (row[index]?.toUpperCase() === "W" ? "W" : "."))
  );
}

function getWaterMatrixColumnCount(value: string | number | boolean | undefined, control: ControlParameter) {
  return getWaterMatrixRows(value, control)[0]?.length ?? 1;
}

function getWaterMatrixCells(value: string | number | boolean | undefined, control: ControlParameter) {
  return getWaterMatrixRows(value, control).flatMap((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      value: cell
    }))
  );
}

function toggleWaterCell(control: ControlParameter, row: number, col: number) {
  const rows = getWaterMatrixRows(props.modelValue[control.id], control);
  const nextRows = rows.map((currentRow, rowIndex) =>
    currentRow.map((cell, colIndex) => (rowIndex === row && colIndex === col ? (cell === "W" ? "." : "W") : cell))
  );
  updateValue(control.id, nextRows.map((currentRow) => currentRow.join("")).join("\n"));
}

function getPathMatrixRows(value: string | number | boolean | undefined, control: ControlParameter) {
  const fallback = String(control.defaultValue);
  const text = String(value ?? fallback).trim() || fallback;
  const rawRows = text
    .split(/\n+/)
    .map((row) => row.trim())
    .filter(Boolean);
  const rows = rawRows.length > 0 ? rawRows : fallback.split(/\n+/);
  const width = Math.max(1, ...rows.map((row) => row.length));

  return rows.map((row) =>
    Array.from({ length: width }, (_, index) => normalizePathCell(row[index]))
  );
}

function normalizePathCell(value: string | undefined): PathCellValue {
  if (value === "S" || value === "E" || value === "#") {
    return value;
  }
  return ".";
}

function getPathMatrixColumnCount(value: string | number | boolean | undefined, control: ControlParameter) {
  return getPathMatrixRows(value, control)[0]?.length ?? 1;
}

function getPathMatrixCells(value: string | number | boolean | undefined, control: ControlParameter) {
  return getPathMatrixRows(value, control).flatMap((row, rowIndex) =>
    row.map((cell, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      value: cell
    }))
  );
}

function setPathCell(control: ControlParameter, row: number, col: number) {
  const mode = pathPaintMode.value;
  const rows = getPathMatrixRows(props.modelValue[control.id], control);
  const nextRows = rows.map((currentRow) =>
    currentRow.map((cell) => (mode === "S" || mode === "E") && cell === mode ? "." : cell)
  );
  nextRows[row][col] = mode;
  updateValue(control.id, nextRows.map((currentRow) => currentRow.join("")).join("\n"));
}

function getPathCellLabel(value: PathCellValue | string) {
  if (value === "S") return "起点";
  if (value === "E") return "终点";
  if (value === "#") return "障碍";
  return "空地";
}

function getPathCellClass(value: PathCellValue) {
  if (value === "S") return "start";
  if (value === "E") return "end";
  if (value === "#") return "wall";
  return "open";
}
</script>
