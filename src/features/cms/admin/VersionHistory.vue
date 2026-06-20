<template>
  <section class="version-panel">
    <header>
      <h2>版本历史</h2>
      <ElButton :disabled="!articleId" @click="load">刷新版本</ElButton>
    </header>
    <ol>
      <li v-for="item in versions" :key="item.versionId">
        <span>{{ item.reason }} · v{{ item.fromVersion }} · {{ item.createdAt }}</span>
        <ElButton size="small" @click="restore(item.versionId)">恢复</ElButton>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";
import { ElButton, ElMessage } from "element-plus";
import { adminFetch } from "./adminClient";

const props = defineProps<{
  articleId: string;
  version: number;
}>();

const emit = defineEmits<{ restored: [] }>();

const versions = ref<Array<{ versionId: string; fromVersion: number; reason: string; createdAt: string }>>([]);

watch(
  () => props.articleId,
  () => void load(),
  { immediate: true }
);

async function load() {
  if (!props.articleId) {
    return;
  }
  const data = await adminFetch<{ items: typeof versions.value }>(`/api/cms/posts/${encodeURIComponent(props.articleId)}/versions`);
  versions.value = data.items;
}

async function restore(versionId: string) {
  try {
    await adminFetch(`/api/cms/posts/${encodeURIComponent(props.articleId)}/rollback`, {
      method: "POST",
      body: JSON.stringify({ versionId, expectedVersion: props.version })
    });
    ElMessage.success("已恢复");
    emit("restored");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "恢复失败");
  }
}
</script>

<style scoped>
.version-panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--surface);
}

.version-panel header,
.version-panel li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.version-panel ol {
  display: grid;
  gap: 0.5rem;
  padding: 0;
  list-style: none;
}
</style>
