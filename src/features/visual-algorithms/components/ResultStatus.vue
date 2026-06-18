<template>
  <div class="va-status" :data-status="status">
    <strong>{{ label }}</strong>
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { VisualizationStatus } from "../data/types";

const props = defineProps<{
  status: VisualizationStatus;
  message: string;
}>();

const label = computed(() => {
  if (props.status === "idle") return "待运行";
  if (props.status === "running") return "运行中";
  if (props.status === "complete") return "已完成";
  if (props.status === "invalid") return "输入无效";
  return "不支持";
});
</script>
