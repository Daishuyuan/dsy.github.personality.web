<template>
  <ElUpload :auto-upload="false" :show-file-list="false" :on-change="handleUpload">
    <ElButton :icon="Upload">上传图片</ElButton>
  </ElUpload>
</template>

<script setup lang="ts">
import { Upload } from "@element-plus/icons-vue";
import { ElButton, ElUpload, type UploadFile } from "element-plus";

const emit = defineEmits<{
  upload: [file: File];
}>();

function handleUpload(file: UploadFile) {
  if (file.raw) {
    emit("upload", file.raw);
  }
  return false;
}
</script>
