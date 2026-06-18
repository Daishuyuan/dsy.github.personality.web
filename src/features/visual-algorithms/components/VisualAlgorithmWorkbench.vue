<template>
  <section class="va-workbench" :data-algorithm-slug="algorithm.slug">
    <div class="va-workbench-main">
      <div class="va-display" aria-label="可视化结果">
        <canvas
          v-if="algorithm.resultMode !== 'text'"
          ref="canvasRef"
          class="va-canvas"
          :aria-label="`${algorithm.title} 可视化画布`"
        />
        <TextResultPanel :result="state.result" />
      </div>
      <ResultStatus :status="state.status" :message="state.message" />
    </div>
    <aside class="va-workbench-controls" aria-label="控制面板">
      <ControlPanel
        v-model="state.controlValues"
        :controls="algorithm.controls"
        @run="run"
        @reset="reset"
      />
    </aside>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { runAlgorithm } from "../algorithms";
import { validateControls } from "../algorithms/validation";
import type { RendererHandle } from "../renderers/renderLifecycle";
import { renderAlgorithmCanvas } from "../renderers";
import type { VisualAlgorithm, VisualizationState } from "../data/types";
import ControlPanel from "./ControlPanel.vue";
import ResultStatus from "./ResultStatus.vue";
import TextResultPanel from "./TextResultPanel.vue";

const props = defineProps<{
  algorithm: VisualAlgorithm;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let rendererHandle: RendererHandle | null = null;

const state = reactive<VisualizationState>({
  status: "idle",
  controlValues: { ...props.algorithm.defaultState },
  lastValidValues: { ...props.algorithm.defaultState },
  result: null,
  message: "使用默认参数开始运行。"
});

async function draw() {
  await nextTick();
  if (!canvasRef.value || !state.result || props.algorithm.resultMode === "text") {
    return;
  }
  rendererHandle?.cleanup();
  rendererHandle = renderAlgorithmCanvas(
    canvasRef.value,
    props.algorithm.rendererKind,
    state.result
  );
}

function clearDisplay() {
  rendererHandle?.cleanup();
  rendererHandle = null;
  state.result = null;
  if (canvasRef.value) {
    canvasRef.value.width = canvasRef.value.width;
  }
}

async function run() {
  const validation = validateControls(props.algorithm.controls, state.controlValues);
  if (!validation.ok) {
    clearDisplay();
    state.status = "invalid";
    state.message = validation.message;
    return;
  }

  state.status = "running";
  state.message = "正在计算并更新可视化。";
  state.lastValidValues = { ...validation.values };
  try {
    state.result = runAlgorithm(props.algorithm.slug, validation.values);
    state.status = "complete";
    state.message = state.result.summary;
    await draw();
  } catch (error) {
    state.status = "invalid";
    state.message = error instanceof Error ? error.message : "运行失败。";
  }
}

async function reset() {
  clearDisplay();
  state.controlValues = { ...props.algorithm.defaultState };
  state.lastValidValues = { ...props.algorithm.defaultState };
  state.status = "idle";
  state.message = "已恢复默认参数。";
  await run();
}

onMounted(() => {
  void run();
});

onBeforeUnmount(() => {
  rendererHandle?.cleanup();
});
</script>
