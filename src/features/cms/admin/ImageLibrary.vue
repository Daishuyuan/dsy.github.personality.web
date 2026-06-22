<template>
  <section class="ops-surface">
    <header class="surface-header">
      <div>
        <span>ASSETS</span>
        <h2>图片</h2>
      </div>
      <div class="filters">
        <ElSegmented v-model="state" :options="stateOptions" @change="load" />
        <ElInput v-model="q" clearable placeholder="搜索图片名或链接" @keyup.enter="load" @clear="load" />
        <ElButton :icon="Refresh" :loading="loading" @click="load">刷新</ElButton>
      </div>
    </header>

    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <ElSkeleton v-if="loading && items.length === 0" :rows="5" animated />
    <ElEmpty v-else-if="items.length === 0" description="暂无图片。" />

    <div v-else class="asset-grid">
      <article v-for="item in items" :key="item.assetId" class="asset-card">
        <img :src="item.publicUrl" :alt="item.originalName" loading="lazy" />
        <div class="asset-body">
          <strong>{{ item.originalName }}</strong>
          <span>{{ item.contentType }} · {{ formatBytes(item.sizeBytes) }}</span>
          <span>引用 {{ item.usageCount }} 处</span>
          <ElTag v-if="item.cleanupCandidate" type="warning">清理候选</ElTag>
          <div v-if="item.usedByArticles.length" class="article-refs">
            <small v-for="article in item.usedByArticles" :key="article.articleId">{{ article.title }}</small>
          </div>
          <div class="asset-actions">
            <ElButton type="primary" :disabled="!currentArticleId" @click="$emit('insert', item)">插入当前文章</ElButton>
            <ElButton
              v-if="item.cleanupCandidate"
              :icon="Delete"
              type="danger"
              plain
              :loading="deletingAssetId === item.assetId"
              @click="confirmDelete(item)"
            >
              删除
            </ElButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Delete, Refresh } from "@element-plus/icons-vue";
import { ElAlert, ElButton, ElEmpty, ElInput, ElMessage, ElMessageBox, ElSegmented, ElSkeleton, ElTag } from "element-plus";
import type { ImageLibraryItem } from "../types";
import { deleteImageAsset, loadImageLibrary } from "./adminClient";

defineProps<{
  currentArticleId?: string;
}>();

defineEmits<{
  insert: [item: ImageLibraryItem];
}>();

const state = ref("all");
const q = ref("");
const loading = ref(false);
const deletingAssetId = ref("");
const error = ref("");
const items = ref<ImageLibraryItem[]>([]);
const stateOptions = [
  { label: "全部", value: "all" },
  { label: "已使用", value: "used" },
  { label: "未使用", value: "unused" },
  { label: "不可用", value: "unavailable" },
  { label: "最近", value: "recent" }
];

onMounted(() => void load());

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await loadImageLibrary({ state: state.value, q: q.value, pageSize: 50 });
    items.value = result.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "图片列表加载失败。";
  } finally {
    loading.value = false;
  }
}

async function confirmDelete(item: ImageLibraryItem) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.originalName}」？删除后会从图片库和对象存储移除，不能撤销。`, "删除未使用图片", {
      confirmButtonText: "直接删除",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger"
    });
    deletingAssetId.value = item.assetId;
    await deleteImageAsset(item.assetId);
    items.value = items.value.filter((candidate) => candidate.assetId !== item.assetId);
    ElMessage.success("图片已删除。");
  } catch (err) {
    if (err === "cancel" || err === "close") {
      return;
    }
    ElMessage.error(err instanceof Error ? err.message : "图片删除失败。");
  } finally {
    if (deletingAssetId.value === item.assetId) {
      deletingAssetId.value = "";
    }
  }
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<style scoped>
.ops-surface {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.surface-header,
.filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.surface-header {
  justify-content: space-between;
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

.filters :deep(.el-input) {
  width: 260px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.85rem;
}

.asset-card {
  overflow: hidden;
  border: 1px solid rgba(185, 169, 148, 0.52);
  border-radius: 7px;
  background: rgba(255, 253, 247, 0.84);
}

.asset-card img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: rgba(28, 33, 33, 0.05);
}

.asset-body,
.article-refs {
  display: grid;
  gap: 0.42rem;
}

.asset-body {
  padding: 0.75rem;
}

.asset-body span,
.article-refs small {
  color: var(--muted);
}

.asset-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
