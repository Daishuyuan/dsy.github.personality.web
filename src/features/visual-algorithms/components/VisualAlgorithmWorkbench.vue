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
        <TextResultPanel :result="state.result" :frame="activeFrame" />
      </div>
      <PlaybackControls
        v-if="hasPlaybackFrames"
        v-model:frame-index="frameIndex"
        v-model:playing="isPlaying"
        v-model:speed="playbackSpeed"
        :frame-count="frames.length"
      />
      <ResultStatus :status="state.status" :message="state.message" />
    </div>
    <aside class="va-workbench-controls" aria-label="控制面板">
      <ControlPanel
        v-model="state.controlValues"
        :controls="algorithm.controls"
        :execution-mode="executionMode"
        @run="run"
        @reset="reset"
      />
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { runAlgorithm } from "../algorithms";
import { validateControls } from "../algorithms/validation";
import type { RendererHandle } from "../renderers/renderLifecycle";
import { renderAlgorithmCanvas } from "../renderers";
import type { AlgorithmFrame, VisualAlgorithm, VisualizationState } from "../data/types";
import ControlPanel from "./ControlPanel.vue";
import PlaybackControls from "./PlaybackControls.vue";
import ResultStatus from "./ResultStatus.vue";
import TextResultPanel from "./TextResultPanel.vue";

const props = defineProps<{
  algorithm: VisualAlgorithm;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let rendererHandle: RendererHandle | null = null;
let autoRunTimer: number | null = null;
let playbackTimer: number | null = null;
const executionMode = props.algorithm.executionMode ?? "manual";
const updateDelayMs = props.algorithm.updateDelayMs ?? 120;
const frameIndex = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(2);

const state = reactive<VisualizationState>({
  status: "idle",
  controlValues: { ...props.algorithm.defaultState },
  lastValidValues: { ...props.algorithm.defaultState },
  result: null,
  message:
    executionMode === "auto"
      ? "参数已就绪，自动更新可视化。"
      : "参数已就绪，点击运行查看结果。"
});

const frames = computed(() => state.result?.frames ?? []);
const hasPlaybackFrames = computed(() => frames.value.length > 1);
const activeFrame = computed<AlgorithmFrame | null>(() => frames.value[frameIndex.value] ?? null);
const playbackDelayMs = computed(() => Math.max(80, Math.round(420 / playbackSpeed.value)));

async function draw() {
  await nextTick();
  if (!canvasRef.value || !state.result || props.algorithm.resultMode === "text") {
    return;
  }
  rendererHandle?.cleanup();
  rendererHandle = renderAlgorithmCanvas(
    canvasRef.value,
    props.algorithm.rendererKind,
    state.result,
    hasPlaybackFrames.value ? { frameIndex: frameIndex.value } : {}
  );
}

function clearDisplay() {
  stopPlayback();
  rendererHandle?.cleanup();
  rendererHandle = null;
  frameIndex.value = 0;
  state.result = null;
  if (canvasRef.value) {
    canvasRef.value.width = canvasRef.value.width;
  }
}

async function run() {
  clearAutoRunTimer();
  stopPlayback();
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
    frameIndex.value = 0;
    await draw();
    state.status = "complete";
    state.message = state.result.summary;
    startPlayback();
  } catch (error) {
    const message = error instanceof Error ? error.message : "运行失败。";
    clearDisplay();
    stopPlayback();
    state.status = "invalid";
    state.message = message;
  }
}

async function reset() {
  clearAutoRunTimer();
  clearDisplay();
  state.controlValues = { ...props.algorithm.defaultState };
  state.lastValidValues = { ...props.algorithm.defaultState };
  state.status = "idle";
  state.message =
    executionMode === "auto"
      ? "已恢复默认参数，自动更新可视化。"
      : "已恢复默认参数，点击运行查看结果。";
}

function clearAutoRunTimer() {
  if (autoRunTimer !== null) {
    window.clearTimeout(autoRunTimer);
    autoRunTimer = null;
  }
}

function clearPlaybackTimer() {
  if (playbackTimer !== null) {
    window.clearTimeout(playbackTimer);
    playbackTimer = null;
  }
}

function stopPlayback() {
  isPlaying.value = false;
  clearPlaybackTimer();
}

function startPlayback() {
  if (!hasPlaybackFrames.value) {
    return;
  }

  if (frameIndex.value >= frames.value.length - 1) {
    frameIndex.value = 0;
  }

  isPlaying.value = true;
  queuePlaybackTick();
}

function queuePlaybackTick() {
  clearPlaybackTimer();
  if (!isPlaying.value || !hasPlaybackFrames.value) {
    return;
  }

  if (frameIndex.value >= frames.value.length - 1) {
    isPlaying.value = false;
    return;
  }

  playbackTimer = window.setTimeout(() => {
    playbackTimer = null;
    if (!isPlaying.value) {
      return;
    }
    frameIndex.value = Math.min(frames.value.length - 1, frameIndex.value + 1);
    queuePlaybackTick();
  }, playbackDelayMs.value);
}

function scheduleAutoRun() {
  if (executionMode !== "auto") {
    return;
  }
  clearAutoRunTimer();
  if (updateDelayMs <= 0) {
    void run();
    return;
  }
  autoRunTimer = window.setTimeout(() => {
    autoRunTimer = null;
    void run();
  }, updateDelayMs);
}

onBeforeUnmount(() => {
  clearAutoRunTimer();
  clearPlaybackTimer();
  rendererHandle?.cleanup();
});

onMounted(() => {
  scheduleAutoRun();
});

watch(
  () => state.controlValues,
  () => {
    scheduleAutoRun();
  },
  { deep: true }
);

watch(frameIndex, () => {
  void draw();
});

watch(isPlaying, (playing) => {
  if (playing) {
    if (hasPlaybackFrames.value && frameIndex.value >= frames.value.length - 1) {
      frameIndex.value = 0;
    }
    queuePlaybackTick();
  } else {
    clearPlaybackTimer();
  }
});

watch(playbackSpeed, () => {
  if (isPlaying.value) {
    queuePlaybackTick();
  }
});
</script>
