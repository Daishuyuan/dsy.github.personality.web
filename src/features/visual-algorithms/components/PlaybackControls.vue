<template>
  <section class="va-playback" aria-label="执行播放控制">
    <div class="va-playback-actions">
      <ElTooltip content="上一帧" placement="top">
        <ElButton
          circle
          :disabled="frameCount <= 1 || frameIndex <= 0"
          aria-label="上一帧"
          @click="emitFrame(frameIndex - 1)"
        >
          <ElIcon><ArrowLeft /></ElIcon>
        </ElButton>
      </ElTooltip>
      <ElTooltip :content="playing ? '暂停' : '播放'" placement="top">
        <ElButton circle type="primary" :disabled="frameCount <= 1" :aria-label="playing ? '暂停' : '播放'" @click="emitPlaying(!playing)">
          <ElIcon>
            <VideoPause v-if="playing" />
            <VideoPlay v-else />
          </ElIcon>
        </ElButton>
      </ElTooltip>
      <ElTooltip content="下一帧" placement="top">
        <ElButton
          circle
          :disabled="frameCount <= 1 || frameIndex >= maxFrameIndex"
          aria-label="下一帧"
          @click="emitFrame(frameIndex + 1)"
        >
          <ElIcon><ArrowRight /></ElIcon>
        </ElButton>
      </ElTooltip>
      <ElTooltip content="从头播放" placement="top">
        <ElButton circle :disabled="frameCount <= 1" aria-label="从头播放" @click="replay">
          <ElIcon><RefreshRight /></ElIcon>
        </ElButton>
      </ElTooltip>
    </div>

    <div class="va-playback-progress">
      <span class="va-frame-index">第 {{ frameIndex + 1 }} / {{ frameCount }} 帧</span>
      <ElSlider
        :model-value="frameIndex"
        :min="0"
        :max="maxFrameIndex"
        :step="1"
        :disabled="frameCount <= 1"
        aria-label="帧进度"
        @update:model-value="(value) => emitFrame(Number(value))"
      />
    </div>

    <label class="va-playback-speed">
      <span>速度</span>
      <ElSelect
        :model-value="speed"
        size="small"
        aria-label="播放速度"
        @update:model-value="(value) => emitSpeed(Number(value))"
      >
        <ElOption
          v-for="option in playbackSpeedOptions"
          :key="option"
          :label="`${option}x`"
          :value="option"
        />
      </ElSelect>
    </label>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft, ArrowRight, RefreshRight, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import { ElButton, ElIcon, ElOption, ElSelect, ElSlider, ElTooltip } from "element-plus";

const props = defineProps<{
  frameCount: number;
  frameIndex: number;
  playing: boolean;
  speed: number;
}>();

const emit = defineEmits<{
  "update:frameIndex": [value: number];
  "update:playing": [value: boolean];
  "update:speed": [value: number];
}>();

const maxFrameIndex = computed(() => Math.max(0, props.frameCount - 1));
const playbackSpeedOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

function clampFrameIndex(value: number) {
  return Math.min(maxFrameIndex.value, Math.max(0, Math.round(value)));
}

function emitFrame(value: number) {
  emit("update:frameIndex", clampFrameIndex(value));
}

function emitPlaying(value: boolean) {
  emit("update:playing", value);
}

function emitSpeed(value: number) {
  emit("update:speed", value);
}

function replay() {
  emitFrame(0);
  emitPlaying(true);
}
</script>
