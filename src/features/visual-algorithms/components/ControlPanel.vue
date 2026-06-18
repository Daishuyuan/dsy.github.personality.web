<template>
  <ElForm class="va-controls" label-position="top">
    <ElFormItem
      v-for="control in controls"
      :key="control.id"
      :label="control.label"
      class="va-control-item"
    >
      <ElInputNumber
        v-if="control.kind === 'integer' || control.kind === 'number'"
        :model-value="Number(modelValue[control.id])"
        :min="control.constraints?.min"
        :max="control.constraints?.max"
        :step="control.constraints?.step ?? 1"
        controls-position="right"
        @update:model-value="(value) => updateValue(control.id, value ?? control.defaultValue)"
      />
      <ElSwitch
        v-else-if="control.kind === 'boolean'"
        :model-value="Boolean(modelValue[control.id])"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <ElSelect
        v-else-if="control.kind === 'choice'"
        :model-value="modelValue[control.id]"
        @update:model-value="(value) => updateValue(control.id, value)"
      >
        <ElOption
          v-for="option in control.constraints?.options ?? []"
          :key="String(option.value)"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElInput
        v-else-if="control.kind === 'matrix'"
        :model-value="String(modelValue[control.id] ?? '')"
        type="textarea"
        :rows="5"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <ElInput
        v-else
        :model-value="String(modelValue[control.id] ?? '')"
        @update:model-value="(value) => updateValue(control.id, value)"
      />
      <p v-if="control.helpText" class="va-help">{{ control.helpText }}</p>
    </ElFormItem>
    <div class="va-control-actions">
      <ElButton type="primary" @click="$emit('run')">运行</ElButton>
      <ElButton @click="$emit('reset')">重置</ElButton>
    </div>
  </ElForm>
</template>

<script setup lang="ts">
import "element-plus/dist/index.css";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch
} from "element-plus";
import type { ControlParameter } from "../data/types";

const props = defineProps<{
  controls: ControlParameter[];
  modelValue: Record<string, string | number | boolean>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string | number | boolean>];
  run: [];
  reset: [];
}>();

function updateValue(id: string, value: string | number | boolean) {
  emit("update:modelValue", {
    ...props.modelValue,
    [id]: value
  });
}
</script>
