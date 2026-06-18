<template>
  <VisualAlgorithmWorkbench v-if="algorithm" :algorithm="algorithm" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getAlgorithmBySlug } from "../data/catalog";
import VisualAlgorithmWorkbench from "./VisualAlgorithmWorkbench.vue";

const props = defineProps<{
  slug: string;
}>();

const algorithm = computed(() => getAlgorithmBySlug(props.slug));
</script>
