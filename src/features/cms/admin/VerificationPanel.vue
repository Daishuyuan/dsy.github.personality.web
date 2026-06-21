<template>
  <section class="ops-surface">
    <header class="surface-header">
      <div>
        <span>VERIFY</span>
        <h2>验证</h2>
      </div>
      <ElButton type="primary" :loading="running" @click="run">运行验证</ElButton>
    </header>

    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <ElEmpty v-if="!runResult && !running" description="尚未运行验证。" />
    <ElSkeleton v-if="running" :rows="5" animated />

    <template v-if="runResult">
      <ElAlert :title="runResult.summary" :type="resultType" :closable="false" show-icon />
      <ol class="steps">
        <li v-for="step in runResult.steps" :key="step.stepId" :class="step.status">
          <b>{{ step.label }} <small v-if="step.required">必需</small></b>
          <span>{{ step.message }}</span>
          <small>{{ step.status }}{{ step.articleId ? ` · ${step.articleId}` : "" }}</small>
        </li>
      </ol>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElAlert, ElButton, ElEmpty, ElSkeleton } from "element-plus";
import type { VerificationRun } from "../types";
import { runVerification } from "./adminClient";

const running = ref(false);
const error = ref("");
const runResult = ref<VerificationRun>();

const resultType = computed(() => {
  if (runResult.value?.status === "passed") {
    return "success";
  }
  return runResult.value?.status === "partial" ? "warning" : "error";
});

async function run() {
  running.value = true;
  error.value = "";
  try {
    runResult.value = await runVerification();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "验证失败。";
  } finally {
    running.value = false;
  }
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

.steps {
  display: grid;
  gap: 0.65rem;
  padding: 0;
  list-style: none;
}

.steps li {
  display: grid;
  gap: 0.25rem;
  border: 1px solid rgba(185, 169, 148, 0.52);
  border-left: 4px solid rgba(31, 111, 104, 0.44);
  border-radius: 7px;
  background: rgba(255, 253, 247, 0.82);
  padding: 0.75rem 0.85rem;
}

.steps li.failed,
.steps li.blocked {
  border-left-color: var(--cinnabar);
}

.steps li.skipped {
  border-left-color: rgba(150, 128, 82, 0.64);
}

.steps span,
.steps small {
  color: var(--muted);
}
</style>
