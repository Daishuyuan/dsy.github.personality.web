<template>
  <section class="preview">
    <h3>预览</h3>
    <div class="article-content" v-html="html" />
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { renderArticlePreviewHtml } from "./previewHtml";

const props = defineProps<{
  markdown: string;
  renderedHtml?: string;
}>();

const html = ref("");
let renderVersion = 0;

watch(
  () => [props.markdown, props.renderedHtml] as const,
  async ([markdown, renderedHtml]) => {
    const version = ++renderVersion;
    if (renderedHtml) {
      html.value = renderedHtml;
    }
    try {
      const rendered = await renderArticlePreviewHtml(markdown, renderedHtml);
      if (version === renderVersion) {
        html.value = rendered;
      }
    } catch {
      if (version === renderVersion) {
        html.value = "<p>预览渲染失败。</p>";
      }
    }
  },
  { immediate: true }
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
