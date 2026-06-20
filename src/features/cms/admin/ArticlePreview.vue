<template>
  <section class="preview">
    <h3>预览</h3>
    <div class="article-content" v-html="html" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ markdown: string }>();

const html = computed(() =>
  props.markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/!\[([^\]]*)]\(([^)]+)\)/gim, '<img alt="$1" src="$2" loading="lazy" />')
    .replace(/\[([^\]]+)]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
);
</script>

<style scoped>
.preview {
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 1rem;
  background: #fbfcfd;
}

.preview :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
