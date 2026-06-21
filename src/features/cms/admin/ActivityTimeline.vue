<template>
  <section class="ops-surface">
    <header class="surface-header">
      <div>
        <span>ACTIVITY</span>
        <h2>活动</h2>
      </div>
      <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
    </header>

    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <ElSkeleton v-if="loading && items.length === 0" :rows="5" animated />
    <ElEmpty v-else-if="items.length === 0" description="暂无活动记录。" />

    <ol v-else class="timeline">
      <li v-for="item in items" :key="item.eventId" :class="{ failure: item.result === 'failure' }">
        <b>{{ actionLabel(item.action) }}</b>
        <span>{{ item.summary }}</span>
        <small>{{ item.createdAt }} · {{ item.articleId || item.assetId || item.actor }}</small>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElAlert, ElButton, ElEmpty, ElSkeleton } from "element-plus";
import type { ActivityRecord, AuditAction } from "../types";
import { loadActivity } from "./adminClient";

const loading = ref(false);
const error = ref("");
const items = ref<ActivityRecord[]>([]);

onMounted(() => void load());

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await loadActivity({ pageSize: 50 });
    items.value = result.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "活动记录加载失败。";
  } finally {
    loading.value = false;
  }
}

function actionLabel(action: AuditAction) {
  const labels: Record<AuditAction, string> = {
    "article.create": "创建文章",
    "article.update": "保存文章",
    "article.publish": "发布文章",
    "article.archive": "归档文章",
    "article.rollback": "恢复版本",
    "asset.upload": "上传图片",
    "import.run": "导入",
    "export.run": "导出",
    "health.run": "健康检查",
    "verification.run": "发布验证",
    "auth.failure": "权限失败",
    "storage.failure": "存储失败"
  };
  return labels[action] ?? action;
}
</script>

<style scoped>
.ops-surface {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.surface-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.surface-header span {
  color: var(--cinnabar);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.surface-header h2 {
  margin: 0.2rem 0 0;
  color: var(--ink);
  font-family: var(--serif);
}

.timeline {
  display: grid;
  gap: 0.65rem;
  padding: 0;
  list-style: none;
}

.timeline li {
  display: grid;
  gap: 0.25rem;
  border: 1px solid rgba(185, 169, 148, 0.52);
  border-left: 4px solid rgba(31, 111, 104, 0.42);
  border-radius: 7px;
  background: rgba(255, 253, 247, 0.82);
  padding: 0.75rem 0.85rem;
}

.timeline li.failure {
  border-left-color: var(--cinnabar);
}

.timeline span,
.timeline small {
  color: var(--muted);
}
</style>
