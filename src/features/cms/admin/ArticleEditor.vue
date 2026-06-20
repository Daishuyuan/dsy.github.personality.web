<template>
  <section class="editor">
    <ElForm class="editor-form" label-position="top">
      <div class="editor-grid">
        <ElFormItem label="标题" class="title-field">
          <ElInput
            :model-value="model.title"
            :prefix-icon="Document"
            clearable
            placeholder="文章标题"
            @update:model-value="setField('title', $event)"
          />
        </ElFormItem>

        <ElFormItem label="发布路径">
          <ElInput
            :model-value="model.legacyPath"
            :prefix-icon="Link"
            clearable
            placeholder="/2026/06/20/title/"
            @update:model-value="setField('legacyPath', $event)"
          />
        </ElFormItem>

        <ElFormItem label="发布日期">
          <ElDatePicker
            :model-value="model.publishedDate"
            :prefix-icon="Calendar"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            @update:model-value="setField('publishedDate', $event)"
          />
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

    <ArticlePreview :markdown="model.markdown ?? ''" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar, Check, CollectionTag, Document, FolderDelete, Link, Promotion } from "@element-plus/icons-vue";
import { ElButton, ElDatePicker, ElForm, ElFormItem, ElInput, ElOption, ElSegmented, ElSelect, ElSwitch } from "element-plus";
import type { Article } from "../types";
import ArticlePreview from "./ArticlePreview.vue";
import ImageUploader from "./ImageUploader.vue";

const props = defineProps<{
  modelValue: Partial<Article>;
  busy: boolean;
  tagOptions: string[];
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

function setField(field: keyof Article, value: unknown) {
  model.value = { ...model.value, [field]: value };
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
  display: grid;
  gap: 1rem;
  padding: 1rem;
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

.editor-grid :deep(.el-date-editor.el-input),
.editor-grid :deep(.el-select),
.markdown-field :deep(.el-textarea) {
  width: 100%;
}

.tags-field {
  grid-column: span 2;
}

.markdown-field {
  margin-bottom: 0;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 720px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .tags-field {
    grid-column: span 1;
  }
}
</style>
