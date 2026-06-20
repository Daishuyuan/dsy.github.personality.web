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
      </section>

      <div class="cms-layout" :class="{ 'without-list': articles.length === 0 }">
        <aside v-if="articles.length > 0" class="cms-list">
          <button
            v-for="article in articles"
            :key="article.articleId"
            class="cms-list-item"
            :class="{ active: article.articleId === selectedArticleId, pending: detailLoading && article.articleId === selectedArticleId }"
            type="button"
            :aria-current="article.articleId === selectedArticleId ? 'true' : undefined"
            @click="selectArticle(article.articleId)"
          >
            <strong>{{ article.title }}</strong>
            <span>{{ statusLabel(article.status) }} · v{{ article.version }}</span>
          </button>
        </aside>

        <ArticleEditor
          v-model="current"
          :busy="busy"
          :loading="detailLoading"
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
import { ElButton, ElInput, ElMessage } from "element-plus";
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
import { withDerivedPublishFields } from "./publishFields";
import VersionHistory from "./VersionHistory.vue";

const ready = ref(false);
const tokenInput = ref("");
const loading = ref(false);
const busy = ref(false);
const detailLoading = ref(false);
const articles = ref<Article[]>([]);
const current = ref<Partial<Article>>(emptyArticle());
const selectedArticleId = ref("");
let selectRequestId = 0;
const baseTagOptions = ["Notes", "算法", "JavaScript", "前端", "后端", "架构", "数据库", "机器学习", "工程实践"];
const statusLabels: Record<Article["status"], string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档"
};
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
  selectedArticleId.value = "";
}

async function loadArticles() {
  loading.value = true;
  try {
    const data = await adminFetch<{ items: Article[] }>("/api/cms/posts");
    articles.value = data.items;
    if (!current.value.articleId && data.items.length > 0) {
      current.value = data.items[0];
      selectedArticleId.value = data.items[0].articleId;
    } else if (current.value.articleId) {
      selectedArticleId.value = current.value.articleId;
    }
  } catch (error) {
    handleAdminError(error, "加载失败");
  } finally {
    loading.value = false;
  }
}

async function selectArticle(articleId: string) {
  const requestId = ++selectRequestId;
  selectedArticleId.value = articleId;
  detailLoading.value = true;
  try {
    const article = await adminFetch<Article>(`/api/cms/posts/${encodeURIComponent(articleId)}`);
    if (requestId === selectRequestId) {
      current.value = article;
    }
  } catch (error) {
    if (requestId === selectRequestId) {
      selectedArticleId.value = current.value.articleId ?? "";
    }
    handleAdminError(error, "加载失败");
  } finally {
    if (requestId === selectRequestId) {
      detailLoading.value = false;
    }
  }
}

async function save() {
  busy.value = true;
  try {
    const draft = withDerivedPublishFields(current.value);
    const method = draft.articleId ? "PATCH" : "POST";
    const path = draft.articleId ? `/api/cms/posts/${encodeURIComponent(draft.articleId)}` : "/api/cms/posts";
    current.value = await adminFetch<Article>(path, { method, body: JSON.stringify(draft) });
    selectedArticleId.value = current.value.articleId ?? "";
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
    selectedArticleId.value = current.value.articleId ?? "";
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
    selectedArticleId.value = current.value.articleId ?? "";
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
  return statusLabels[value] ?? value;
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

.cms-toolbar,
.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.cms-toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
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
  position: relative;
  display: grid;
  gap: 0.35rem;
  min-height: 104px;
  text-align: left;
  border: 1px solid rgba(185, 169, 148, 0.58);
  border-radius: 7px;
  background:
    linear-gradient(135deg, rgba(255, 253, 247, 0.98), rgba(251, 250, 246, 0.92)),
    var(--paper-warm);
  padding: 0.82rem 0.9rem;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(54, 45, 31, 0.045);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease,
    transform 160ms ease;
  overflow: visible;
}

.cms-list-item::before,
.cms-list-item::after {
  position: absolute;
  pointer-events: none;
  content: "";
}

.cms-list-item::before {
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, transparent, rgba(31, 111, 104, 0.46), transparent);
  opacity: 0;
  transform: scaleY(0.46);
  transform-origin: 50% 50%;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.cms-list-item:hover {
  border-color: rgba(167, 51, 43, 0.36);
  box-shadow: 0 14px 28px rgba(54, 45, 31, 0.07);
}

.cms-list-item:focus-visible {
  outline: 3px solid rgba(31, 111, 104, 0.26);
  outline-offset: 3px;
}

.cms-list-item.active {
  border-color: rgba(167, 51, 43, 0.82);
  background:
    radial-gradient(circle at 92% 20%, rgba(167, 51, 43, 0.12), transparent 34px),
    linear-gradient(135deg, rgba(255, 253, 247, 1), rgba(243, 238, 228, 0.82)),
    var(--paper-warm);
  box-shadow:
    inset 0 0 0 1px rgba(167, 51, 43, 0.15),
    inset 7px 0 0 rgba(167, 51, 43, 0.14),
    0 18px 34px rgba(54, 45, 31, 0.12);
  transform: translateX(2px);
}

.cms-list-item.active::before {
  opacity: 1;
  transform: scaleY(1);
  background:
    linear-gradient(180deg, transparent 0, rgba(31, 111, 104, 0.72) 18%, rgba(167, 51, 43, 0.86) 52%, rgba(31, 111, 104, 0.58) 84%, transparent 100%);
}

.cms-list-item.active::after {
  right: 0.72rem;
  bottom: 0.66rem;
  display: grid;
  place-items: center;
  width: 1.78rem;
  height: 1.78rem;
  border: 1px solid rgba(127, 33, 28, 0.42);
  border-radius: 6px;
  background: var(--cinnabar);
  color: #fff8ef;
  font-family: var(--serif);
  font-size: 0.86rem;
  font-weight: 850;
  line-height: 1;
  content: "阅";
  box-shadow:
    inset 0 0 0 2px rgba(255, 248, 239, 0.28),
    0 7px 14px rgba(127, 33, 28, 0.19);
  transform: rotate(-5deg);
}

.cms-list-item.active strong {
  color: var(--cinnabar-strong);
}

.cms-list-item span {
  color: var(--muted);
  font-size: 0.86rem;
}

.cms-list-item.active span {
  padding-right: 2.35rem;
  color: var(--jade);
  font-weight: 700;
}

@media (max-width: 860px) {
  .cms-layout {
    grid-template-columns: 1fr;
  }
}
</style>
