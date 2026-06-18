<template>
  <section class="engagement-panel" aria-label="评论与点赞">
    <div class="engagement-header">
      <div>
        <p class="eyebrow">Discussion</p>
        <h2>评论与点赞</h2>
      </div>
      <ElButton
        :type="state.liked ? 'primary' : 'default'"
        :loading="state.likeBusy"
        :aria-label="state.liked ? `取消点赞，当前 ${state.likes}` : `点赞，当前 ${state.likes}`"
        @click="toggleLike"
      >
        <ElIcon>
          <StarFilled v-if="state.liked" />
          <Star v-else />
        </ElIcon>
        <span>{{ state.likes }}</span>
      </ElButton>
    </div>

    <p v-if="state.error" class="engagement-error">{{ state.error }}</p>

    <div class="comment-list" aria-live="polite">
      <article v-for="comment in state.comments" :key="comment.id" class="comment-item">
        <header>
          <strong>{{ comment.author }}</strong>
          <time :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
        </header>
        <p>{{ comment.body }}</p>
      </article>

      <p v-if="!state.loading && state.comments.length === 0" class="comment-empty">暂无评论。</p>
    </div>

    <ElForm class="comment-form" label-position="top" @submit.prevent="submitComment">
      <ElFormItem label="昵称">
        <ElInput
          v-model="draft.author"
          :maxlength="AUTHOR_MAX_LENGTH"
          show-word-limit
          autocomplete="name"
          aria-label="昵称"
        />
      </ElFormItem>
      <ElFormItem label="评论">
        <ElInput
          v-model="draft.body"
          type="textarea"
          :rows="4"
          :maxlength="COMMENT_MAX_LENGTH"
          show-word-limit
          aria-label="评论"
        />
      </ElFormItem>
      <div class="comment-actions">
        <ElButton type="primary" :loading="state.commentBusy" native-type="submit">
          <ElIcon><Promotion /></ElIcon>
          <span>发表评论</span>
        </ElButton>
        <span>免登录发表，提交后公开显示。</span>
      </div>
    </ElForm>
  </section>
</template>

<script setup lang="ts">
import "element-plus/dist/index.css";
import { onMounted, reactive } from "vue";
import { Promotion, Star, StarFilled } from "@element-plus/icons-vue";
import { ElButton, ElForm, ElFormItem, ElIcon, ElInput } from "element-plus";
import type { EngagementSnapshot, PublicComment } from "../types";
import { AUTHOR_MAX_LENGTH, COMMENT_MAX_LENGTH } from "../validation";

const props = defineProps<{
  articleId: string;
  title: string;
}>();

const state = reactive({
  loading: true,
  likeBusy: false,
  commentBusy: false,
  error: "",
  likes: 0,
  liked: false,
  comments: [] as PublicComment[]
});

const draft = reactive({
  author: "",
  body: ""
});

onMounted(() => {
  void loadSnapshot();
});

async function loadSnapshot() {
  state.loading = true;
  state.error = "";
  try {
    applySnapshot(
      await request<EngagementSnapshot>(`/api/engagement?articleId=${encodeURIComponent(props.articleId)}`, {
        method: "GET"
      })
    );
  } catch (error) {
    state.error = error instanceof Error ? error.message : "互动服务暂不可用。";
  } finally {
    state.loading = false;
  }
}

async function toggleLike() {
  state.likeBusy = true;
  state.error = "";
  try {
    const result = await request<{ liked: boolean; likes: number }>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({
        action: "like",
        articleId: props.articleId,
        visitorId: getVisitorId()
      })
    });
    state.liked = result.liked;
    state.likes = result.likes;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "点赞失败。";
  } finally {
    state.likeBusy = false;
  }
}

async function submitComment() {
  state.commentBusy = true;
  state.error = "";
  try {
    const result = await request<{ comment: PublicComment }>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({
        action: "comment",
        articleId: props.articleId,
        visitorId: getVisitorId(),
        author: draft.author,
        body: draft.body
      })
    });
    state.comments = [result.comment, ...state.comments];
    draft.body = "";
  } catch (error) {
    state.error = error instanceof Error ? error.message : "评论提交失败。";
  } finally {
    state.commentBusy = false;
  }
}

async function request<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-visitor-id": getVisitorId(),
      ...(init.headers ?? {})
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "请求失败。");
  }
  return payload as T;
}

function applySnapshot(snapshot: EngagementSnapshot) {
  state.likes = snapshot.likes;
  state.liked = snapshot.liked;
  state.comments = snapshot.comments;
}

function getVisitorId() {
  const key = "dsy-blog-visitor-id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
</script>
