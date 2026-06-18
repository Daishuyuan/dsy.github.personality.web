<template>
  <section class="va-text-result" aria-label="算法结果">
    <h3>{{ result?.summary ?? "等待运行" }}</h3>
    <div v-if="frame" class="va-frame-summary">
      <strong>{{ frame.phase ?? frame.message ?? "当前步骤" }}</strong>
      <p v-if="frame.explanation || frame.message">
        {{ frame.explanation ?? frame.message }}
      </p>
      <dl v-if="frameMetrics.length" class="va-frame-metrics">
        <div v-for="[key, value] in frameMetrics" :key="key" class="va-frame-metric">
          <dt>{{ key }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
    </div>
    <dl v-else-if="resultMetrics.length" class="va-frame-metrics">
      <div v-for="[key, value] in resultMetrics" :key="key" class="va-frame-metric">
        <dt>{{ key }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>
    <ul v-if="result?.lines?.length">
      <li v-for="line in result.lines" :key="line">{{ line }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AlgorithmFrame, AlgorithmResult } from "../data/types";

const props = defineProps<{
  result: AlgorithmResult | null;
  frame?: AlgorithmFrame | null;
}>();

const frameMetrics = computed(() => Object.entries(props.frame?.metrics ?? {}));
const resultMetrics = computed(() => Object.entries(props.result?.metrics ?? {}));
</script>
