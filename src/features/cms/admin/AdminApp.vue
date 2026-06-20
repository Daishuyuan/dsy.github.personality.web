<template>
  <main class="cms-admin">
    <section v-if="!ready" class="cms-panel auth-panel">
      <h2>Owner Token</h2>
      <ElInput v-model="tokenInput" type="password" show-password placeholder="ADMIN_TOKEN" @keyup.enter="saveToken" />
      <ElButton type="primary" @click="saveToken">进入</ElButton>
    </section>

    <template v-else>
      <section class="cms-toolbar">
        <div class="toolbar-actions">
          <ElButton type="primary" :icon="Plus" @click="createNew">新文章</ElButton>
          <ElButton :icon="Refresh" :loading="loading" @click="loadArticles">刷新</ElButton>
        </div>
        <div class="toolbar-filter">
          <span class="toolbar-label">状态</span>
          <ElSegmented v-model="status" :options="statusFilterOptions" @change="loadArticles" />
        </div>
      </section>

      <div class="cms-layout" :class="{ 'without-list': articles.length === 0 }">
        <aside v-if="articles.length > 0" class="cms-list">
          <button
            v-for="article in articles"
            :key="article.articleId"
            class="cms-list-item"
            :class="{ active: article.articleId === current.articleId }"
            type="button"
            @click="selectArticle(article.articleId)"
          >
            <strong>{{ article.title }}</strong>
            <span>{{ statusLabel(article.status) }} · v{{ article.version }}</span>
          </button>
        </aside>

        <ArticleEditor
          v-model="current"
          :busy="busy"
          :tag-options="tagOptions"
          @save="save"
          @publish="publish"
          @archive="archive"
          @upload="upload"
        />
      </div>

      <VersionHistory
        v-if="current.articleId"
        :article-id="current.articleId"
        :version="current.version ?? 0"
        @restored="selectArticle(current.articleId!)"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import "element-plus/dist/index.css";
import { computed, onMounted, ref } from "vue";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElButton, ElInput, ElMessage, ElSegmented } from "element-plus";
import type { Article } from "../types";
import {
  AdminRequestError,
  adminFetch,
  clearStoredToken,
  emptyArticle,
  fileToUploadPayload,
  getStoredToken,
  storeToken
} from "./adminClient";
import ArticleEditor from "./ArticleEditor.vue";
import VersionHistory from "./VersionHistory.vue";

const ready = ref(false);
const tokenInput = ref("");
const loading = ref(false);
const busy = ref(false);
const status = ref("");
const articles = ref<Article[]>([]);
const current = ref<Partial<Article>>(emptyArticle());
const baseTagOptions = ["Notes", "算法", "JavaScript", "前端", "后端", "架构", "数据库", "机器学习", "工程实践"];
const statusFilterOptions = [
  { label: "全部", value: "" },
  { label: "草稿", value: "draft" },
  { label: "已发布", value: "published" },
  { label: "已归档", value: "archived" }
];
const tagOptions = computed(() => {
  const tags = new Set<string>(baseTagOptions);
  for (const article of articles.value) {
    for (const tag of article.tags ?? []) {
      tags.add(tag);
    }
  }
  for (const tag of current.value.tags ?? []) {
    tags.add(tag);
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, "zh-CN"));
});

onMounted(() => {
  tokenInput.value = getStoredToken();
  ready.value = Boolean(tokenInput.value);
  if (ready.value) {
    void loadArticles();
  }
});

function saveToken() {
  storeToken(tokenInput.value.trim());
  ready.value = true;
  void loadArticles();
}

function createNew() {
  current.value = emptyArticle();
}

async function loadArticles() {
  loading.value = true;
  try {
    const query = status.value ? `?status=${encodeURIComponent(status.value)}` : "";
    const data = await adminFetch<{ items: Article[] }>(`/api/cms/posts${query}`);
    articles.value = data.items;
    if (!current.value.articleId && data.items.length > 0) {
      current.value = data.items[0];
    }
  } catch (error) {
    handleAdminError(error, "加载失败");
  } finally {
    loading.value = false;
  }
}

async function selectArticle(articleId: string) {
  try {
    current.value = await adminFetch<Article>(`/api/cms/posts/${encodeURIComponent(articleId)}`);
  } catch (error) {
    handleAdminError(error, "加载失败");
  }
}

async function save() {
  busy.value = true;
  try {
    const method = current.value.articleId ? "PATCH" : "POST";
    const path = current.value.articleId ? `/api/cms/posts/${encodeURIComponent(current.value.articleId)}` : "/api/cms/posts";
    current.value = await adminFetch<Article>(path, { method, body: JSON.stringify(current.value) });
    await loadArticles();
    ElMessage.success("已保存");
  } catch (error) {
    handleAdminError(error, "保存失败");
  } finally {
    busy.value = false;
  }
}

async function publish() {
  if (!current.value.articleId || !current.value.version) {
    await save();
  }
  if (!current.value.articleId || !current.value.version) {
    return;
  }
  try {
    current.value = await adminFetch<Article>(`/api/cms/posts/${encodeURIComponent(current.value.articleId)}/publish`, {
      method: "POST",
      body: JSON.stringify({ expectedVersion: current.value.version })
    });
    await loadArticles();
  } catch (error) {
    handleAdminError(error, "发布失败");
  }
}

async function archive() {
  if (!current.value.articleId || !current.value.version) {
    return;
  }
  try {
    current.value = await adminFetch<Article>(`/api/cms/posts/${encodeURIComponent(current.value.articleId)}/archive`, {
      method: "POST",
      body: JSON.stringify({ expectedVersion: current.value.version })
    });
    await loadArticles();
  } catch (error) {
    handleAdminError(error, "归档失败");
  }
}

async function upload(file: File) {
  try {
    const payload = await fileToUploadPayload(file, current.value.articleId);
    const asset = await adminFetch<{ publicUrl: string }>("/api/cms/assets", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    current.value.markdown = `${current.value.markdown ?? ""}\n\n![${file.name}](${asset.publicUrl})\n`;
  } catch (error) {
    handleAdminError(error, "上传失败");
  }
}

function statusLabel(value: Article["status"]) {
  return statusFilterOptions.find((option) => option.value === value)?.label ?? value;
}

function handleAdminError(error: unknown, fallback: string) {
  if (error instanceof AdminRequestError && (error.status === 401 || error.code === "AUTH_REQUIRED")) {
    clearStoredToken();
    tokenInput.value = "";
    ready.value = false;
    articles.value = [];
    current.value = emptyArticle();
    ElMessage.error("管理权限已失效，请重新输入 Owner Token。");
    return;
  }

  ElMessage.error(error instanceof Error ? error.message : fallback);
}
</script>

<style scoped>
.cms-admin {
  display: grid;
  gap: 1rem;
}

.cms-panel,
.cms-toolbar,
.cms-list,
.cms-layout {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.auth-panel,
.cms-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
}

.cms-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
}

.toolbar-actions,
.toolbar-filter {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.toolbar-label {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.cms-layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) 1fr;
  min-height: 680px;
  overflow: hidden;
}

.cms-layout.without-list {
  grid-template-columns: 1fr;
}

.cms-list {
  display: grid;
  align-content: start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-width: 0 1px 0 0;
  border-radius: 0;
  max-height: 780px;
  overflow: auto;
}

.cms-list-item {
  display: grid;
  gap: 0.35rem;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: white;
  padding: 0.75rem;
}

.cms-list-item.active {
  border-color: var(--accent);
}

.cms-list-item span {
  color: var(--muted);
  font-size: 0.86rem;
}

@media (max-width: 860px) {
  .cms-layout {
    grid-template-columns: 1fr;
  }
}
</style>
