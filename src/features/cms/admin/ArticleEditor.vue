<template>
  <section class="editor" :class="{ loading }" :aria-busy="loading ? 'true' : 'false'">
    <ElForm class="editor-form" label-position="top">
      <div class="editor-grid">
        <ElFormItem label="标题" class="title-field">
          <ElInput
            :model-value="model.title"
            :prefix-icon="Document"
            clearable
            placeholder="文章标题"
            @update:model-value="setTitle"
          />
          <p class="path-preview">{{ derivedLegacyPath }}</p>
        </ElFormItem>

        <ElFormItem label="发布状态">
          <ElSegmented
            :model-value="model.status ?? 'draft'"
            :options="statusOptions"
            @update:model-value="setField('status', $event)"
          />
        </ElFormItem>

        <ElFormItem label="标签" class="tags-field">
          <ElSelect
            :model-value="model.tags ?? []"
            multiple
            filterable
            allow-create
            default-first-option
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="6"
            no-data-text="输入后按 Enter 创建标签"
            :reserve-keyword="false"
            :prefix-icon="CollectionTag"
            placeholder="输入标签后回车"
            @update:model-value="setTags"
          >
            <ElOption v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="目录">
          <ElSwitch
            :model-value="Boolean(model.toc)"
            inline-prompt
            :width="64"
            active-text="显示"
            inactive-text="隐藏"
            @update:model-value="setField('toc', $event)"
          />
        </ElFormItem>
      </div>

      <ElFormItem label="正文 Markdown" class="markdown-field">
        <ElInput
          :model-value="model.markdown"
          type="textarea"
          :rows="18"
          resize="vertical"
          placeholder="Markdown"
          @update:model-value="setField('markdown', $event)"
        />
      </ElFormItem>
    </ElForm>

    <div class="editor-actions">
      <ImageUploader @upload="$emit('upload', $event)" />
      <ElButton type="primary" :icon="Check" :loading="busy" @click="$emit('save')">保存</ElButton>
      <ElButton type="success" :icon="Promotion" :loading="busy" @click="$emit('publish')">发布</ElButton>
      <ElButton :icon="FolderDelete" :disabled="!model.articleId" @click="$emit('archive')">归档</ElButton>
    </div>

    <ArticlePreview :markdown="model.markdown ?? ''" :rendered-html="model.renderedHtml" />

    <div v-if="loading" class="ink-loading" role="status" aria-live="polite">
      <div class="ink-loader" aria-hidden="true">
        <span class="ink-ring" />
        <span class="ink-seal">载</span>
      </div>
      <p>文章载入中</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { Check, CollectionTag, Document, FolderDelete, Promotion } from "@element-plus/icons-vue";
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSegmented, ElSelect, ElSwitch } from "element-plus";
import type { Article } from "../types";
import ArticlePreview from "./ArticlePreview.vue";
import ImageUploader from "./ImageUploader.vue";
import { legacyPathFromTitle, todayDate } from "./publishFields";

const props = defineProps<{
  modelValue: Partial<Article>;
  busy: boolean;
  loading: boolean;
  tagOptions: string[];
  imageInsertion?: {
    nonce: number;
    markdown: string;
  };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Partial<Article>];
  save: [];
  publish: [];
  archive: [];
  upload: [file: File];
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

const statusOptions = [
  { label: "草稿", value: "draft" },
  { label: "已发布", value: "published" },
  { label: "已归档", value: "archived" }
];
const derivedLegacyPath = computed(() => legacyPathFromTitle(model.value.title ?? "New Note", model.value.publishedDate ?? todayDate()));

watch(
  () => props.imageInsertion?.nonce,
  () => {
    if (!props.imageInsertion?.markdown) {
      return;
    }
    const currentMarkdown = model.value.markdown ?? "";
    if (currentMarkdown.includes(props.imageInsertion.markdown)) {
      return;
    }
    model.value = {
      ...model.value,
      markdown: `${currentMarkdown.trimEnd()}\n\n${props.imageInsertion.markdown}\n`
    };
  }
);

function setField(field: keyof Article, value: unknown) {
  model.value = { ...model.value, [field]: value };
}

function setTitle(value: unknown) {
  const title = String(value ?? "");
  const publishedDate = model.value.publishedDate || todayDate();
  model.value = {
    ...model.value,
    title,
    publishedDate,
    legacyPath: legacyPathFromTitle(title || "New Note", publishedDate)
  };
}

function setTags(value: unknown) {
  model.value = {
    ...model.value,
    tags: Array.isArray(value) ? value.map(String).filter(Boolean) : []
  };
}
</script>

<style scoped>
.editor {
  position: relative;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  min-height: 680px;
  isolation: isolate;
}

.editor.loading {
  overflow: hidden;
}

.editor-form {
  display: grid;
  gap: 0.25rem;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.editor-grid :deep(.el-form-item) {
  margin-bottom: 0.15rem;
}

.editor-grid :deep(.el-select),
.markdown-field :deep(.el-textarea) {
  width: 100%;
}

.title-field,
.tags-field {
  grid-column: span 2;
}

.tags-field :deep(.el-select__wrapper) {
  min-height: 2.5rem;
}

.path-preview {
  margin: 0.45rem 0 0;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.markdown-field {
  margin-bottom: 0;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.ink-loading {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  place-items: start center;
  align-content: start;
  gap: 0.9rem;
  min-height: 100%;
  padding-top: clamp(5.5rem, 14vh, 8rem);
  border-left: 1px solid rgba(185, 169, 148, 0.22);
  background:
    radial-gradient(circle at 43% 42%, rgba(31, 111, 104, 0.08), transparent 18rem),
    radial-gradient(circle at 58% 58%, rgba(167, 51, 43, 0.07), transparent 14rem),
    linear-gradient(135deg, rgba(255, 253, 247, 0.88), rgba(238, 244, 240, 0.82));
  backdrop-filter: blur(5px);
}

.ink-loading::before,
.ink-loading::after {
  position: absolute;
  pointer-events: none;
  content: "";
}

.ink-loading::before {
  top: clamp(1.8rem, 6vh, 4rem);
  left: 50%;
  width: min(36rem, 62vw);
  height: min(36rem, 62vw);
  border-radius: 50%;
  background:
    radial-gradient(circle at 48% 43%, rgba(28, 33, 33, 0.1), transparent 2.4rem),
    radial-gradient(circle at 54% 55%, rgba(28, 33, 33, 0.07), transparent 4.8rem),
    radial-gradient(circle at 50% 50%, rgba(31, 111, 104, 0.06), transparent 10rem);
  filter: blur(0.7px);
  translate: -50% 0;
  animation: ink-bloom 2.8s ease-in-out infinite;
}

.ink-loading::after {
  top: clamp(12.4rem, 25vh, 15rem);
  left: 50%;
  width: min(28rem, 54vw);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(28, 33, 33, 0.26), transparent);
  transform: translateX(-50%);
}

.ink-loader {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 6.25rem;
  height: 6.25rem;
}

.ink-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(from 40deg, rgba(28, 33, 33, 0), rgba(28, 33, 33, 0.66), rgba(167, 51, 43, 0.18), rgba(28, 33, 33, 0)),
    radial-gradient(circle, transparent 57%, rgba(28, 33, 33, 0.24) 59%, transparent 63%);
  mask: radial-gradient(circle, transparent 56%, #000 58%, #000 64%, transparent 67%);
  animation: ink-turn 1.55s linear infinite;
}

.ink-ring::before,
.ink-ring::after {
  position: absolute;
  border-radius: 50%;
  background: rgba(28, 33, 33, 0.42);
  content: "";
}

.ink-ring::before {
  top: 0.92rem;
  right: 1.34rem;
  width: 0.62rem;
  height: 0.62rem;
}

.ink-ring::after {
  right: 0.84rem;
  bottom: 1.18rem;
  width: 0.35rem;
  height: 0.35rem;
  opacity: 0.72;
}

.ink-seal {
  z-index: 1;
  display: grid;
  place-items: center;
  width: 2.52rem;
  height: 2.52rem;
  border: 1px solid rgba(127, 33, 28, 0.5);
  border-radius: 7px;
  background: rgba(167, 51, 43, 0.94);
  color: #fff8ef;
  font-family: var(--serif);
  font-size: 1.18rem;
  font-weight: 850;
  box-shadow:
    inset 0 0 0 2px rgba(255, 248, 239, 0.24),
    0 10px 24px rgba(127, 33, 28, 0.18);
  transform: rotate(-7deg);
}

.ink-loading p {
  position: relative;
  z-index: 1;
  margin: 0;
  color: rgba(28, 33, 33, 0.72);
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
}

@keyframes ink-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ink-bloom {
  0%,
  100% {
    opacity: 0.52;
    transform: scale(0.94);
  }

  50% {
    opacity: 0.82;
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ink-ring,
  .ink-loading::before {
    animation: none;
  }
}

@media (max-width: 720px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .title-field,
  .tags-field {
    grid-column: span 1;
  }
}
</style>
