<template>
  <section class="va-text-result" aria-label="算法结果">
    <h3>{{ result?.summary ?? "等待运行" }}</h3>
    <ul v-if="result?.lines?.length">
      <li v-for="line in result.lines" :key="line">{{ line }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { AlgorithmResult } from "../data/types";

defineProps<{
  result: AlgorithmResult | null;
}>();
</script>
