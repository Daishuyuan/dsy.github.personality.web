<template>
  <section class="ops-surface">
    <header class="surface-header">
      <div>
        <span>HEALTH</span>
        <h2>内容健康</h2>
      </div>
      <div class="header-actions">
        <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
        <ElButton type="primary" :loading="checking" @click="check">运行检查</ElButton>
      </div>
    </header>

    <ElAlert v-if="error" :title="error" type="error" :closable="false" />

    <ElSkeleton v-if="loading && !summary" :rows="5" animated />
    <template v-else-if="summary">
      <div class="metric-grid">
        <div class="metric">
          <b>{{ summary.content.articleCount }}</b>
          <span>文章</span>
        </div>
        <div class="metric">
          <b>{{ summary.assets.assetCount }}</b>
          <span>图片</span>
        </div>
        <div class="metric" :class="{ warn: summary.content.duplicatePathCount > 0 }">
          <b>{{ summary.content.duplicatePathCount }}</b>
          <span>重复路径</span>
        </div>
        <div class="metric" :class="{ warn: summary.assets.unusedCount > 0 }">
          <b>{{ summary.assets.unusedCount }}</b>
          <span>未引用图片</span>
        </div>
      </div>

      <ElAlert
        :title="healthTitle"
        :type="healthType"
        :closable="false"
        show-icon
      />

      <div v-if="summary.latestHealth?.issues?.length" class="issue-list">
        <article v-for="issue in summary.latestHealth.issues" :key="issue.issueId" class="issue">
          <strong>{{ issue.message }}</strong>
          <span>{{ issue.recommendedAction }}</span>
          <small>{{ issue.articleId || issue.assetId || issue.imageSource }}</small>
        </article>
      </div>
      <ElEmpty v-else description="暂无健康问题。" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElAlert, ElButton, ElEmpty, ElSkeleton } from "element-plus";
import type { OperationsSummary } from "../types";
import { loadOperationsSummary, runHealthCheck } from "./adminClient";

const summary = ref<OperationsSummary>();
const loading = ref(false);
const checking = ref(false);
const error = ref("");

const healthType = computed(() => {
  if (!summary.value?.latestHealth) {
    return "info";
  }
  return summary.value.latestHealth.status === "failed"
    ? "error"
    : summary.value.latestHealth.status === "warning"
      ? "warning"
      : "success";
});

const healthTitle = computed(() => {
  if (!summary.value?.latestHealth) {
    return "尚未运行健康检查。";
  }
  return `最近检查：${summary.value.latestHealth.status}，${summary.value.latestHealth.issueCount} 个问题。`;
});

onMounted(() => void load());

async function load() {
  loading.value = true;
  error.value = "";
  try {
    summary.value = await loadOperationsSummary(true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "健康信息加载失败。";
  } finally {
    loading.value = false;
  }
}

async function check() {
  checking.value = true;
  error.value = "";
  try {
    await runHealthCheck();
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "健康检查失败。";
  } finally {
    checking.value = false;
  }
}
</script>

<style scoped>
.ops-surface {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.surface-header,
.header-actions,
.metric-grid {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.surface-header {
  justify-content: space-between;
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric,
.issue {
  border: 1px solid rgba(185, 169, 148, 0.52);
  border-radius: 7px;
  background: rgba(255, 253, 247, 0.78);
  padding: 0.85rem;
}

.metric b {
  display: block;
  color: var(--ink);
  font-size: 1.7rem;
}

.metric span,
.issue span,
.issue small {
  color: var(--muted);
}

.metric.warn b {
  color: var(--cinnabar);
}

.issue-list {
  display: grid;
  gap: 0.65rem;
}

.issue {
  display: grid;
  gap: 0.25rem;
}

@media (max-width: 760px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
