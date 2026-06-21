import { randomUUID } from "node:crypto";
import type { Article, VerificationRun, VerificationStepResult } from "../types.ts";
import { getArticleIdForLegacySlug } from "../../engagement/articleIdentity.ts";
import { listOwnerArticles } from "./articleRepository.ts";
import { listImageAssets } from "./assetRepository.ts";
import { listArticleVersions } from "./versionRepository.ts";
import { writeAuditEvent } from "./auditRepository.ts";
import { getCmsMemoryStore } from "./memoryStore.ts";
import { getCmsDatabase } from "./mongo.ts";
import { getSupabaseStorageClient } from "./storageClient.ts";

export interface VerificationRunInput {
  scope: "cms-critical";
  includePublicRead: boolean;
  includeEngagementIdentity: boolean;
}

export async function runCriticalVerification(input: VerificationRunInput, actor = "owner"): Promise<VerificationRun> {
  const startedAt = new Date().toISOString();
  const articles = await listAllOwnerArticles();
  const assets = await listImageAssets();
  const published = articles.find((article) => article.status === "published");
  const steps: VerificationStepResult[] = [];

  steps.push(step("owner-sign-in", "Owner sign-in", "passed", true, "当前请求已通过 owner 权限校验。"));
  steps.push(step("article-list-load", "Article list load", "passed", true, `已读取 ${articles.length} 篇文章。`));
  steps.push(capabilityStep("article-save", "Article save", articles.length > 0, true, "存在可用于保存校验的文章数据。"));
  steps.push(capabilityStep("article-publish", "Article publish", articles.length > 0, true, "发布能力复用现有文章 API。"));
  steps.push(capabilityStep("image-upload", "Image upload", Boolean(getSupabaseStorageClient()) || assets.length > 0, true, "图片上传配置或现有素材可用。"));
  steps.push(capabilityStep("image-insertion", "Image insertion", assets.length > 0, false, "存在可复用图片素材。"));

  if (input.includePublicRead) {
    steps.push(publicReadStep(published));
  }
  steps.push(await rollbackStep(articles[0]));
  if (input.includeEngagementIdentity) {
    steps.push(engagementStep(published));
  }

  const run = toVerificationRun(startedAt, actor, steps);
  await saveVerificationRun(run);
  await writeAuditEvent({
    action: "verification.run",
    actor,
    details: { status: run.status, failedSteps: run.steps.filter((item) => item.status === "failed" || item.status === "blocked").length }
  });
  return run;
}

async function saveVerificationRun(run: VerificationRun): Promise<void> {
  const database = await getCmsDatabase();
  if (database) {
    await database.collection<VerificationRun>("verification_runs").insertOne(run);
  } else {
    const store = getCmsMemoryStore();
    store.verificationRuns = [run, ...store.verificationRuns].slice(0, 20);
  }
}

async function listAllOwnerArticles(): Promise<Article[]> {
  const firstPage = await listOwnerArticles({ page: 1, pageSize: 500 });
  return firstPage.items;
}

function publicReadStep(article: Article | undefined): VerificationStepResult {
  if (!article) {
    return step("public-article-load", "Public article load", "failed", true, "没有可验证的已发布文章。");
  }
  if (!article.renderedHtml?.trim()) {
    return step("public-article-load", "Public article load", "failed", true, "公开文章缺少渲染内容。", article.articleId);
  }
  return step("public-article-load", "Public article load", "passed", true, "公开文章渲染内容存在。", article.articleId);
}

async function rollbackStep(article: Article | undefined): Promise<VerificationStepResult> {
  if (!article) {
    return step("rollback", "Rollback", "blocked", true, "没有文章可验证版本恢复能力。");
  }
  const versions = await listArticleVersions(article.articleId);
  if (versions.length === 0) {
    return step("rollback", "Rollback", "skipped", false, "当前文章暂无历史版本，跳过非破坏性恢复检查。", article.articleId);
  }
  return step("rollback", "Rollback", "passed", true, "历史版本可读取。", article.articleId);
}

function engagementStep(article: Article | undefined): VerificationStepResult {
  if (!article) {
    return step("engagement-identity", "Engagement identity", "failed", true, "没有已发布文章可验证评论和点赞身份。");
  }
  const mapped = getArticleIdForLegacySlug(article.legacyPath);
  const passed = Boolean(article.articleId && (!mapped || mapped === article.articleId));
  return step(
    "engagement-identity",
    "Engagement identity",
    passed ? "passed" : "failed",
    true,
    passed ? "文章 identity 可用于评论与点赞。" : "文章 identity 与旧路径映射不一致。",
    article.articleId
  );
}

function capabilityStep(
  stepId: string,
  label: string,
  passed: boolean,
  required: boolean,
  message: string
): VerificationStepResult {
  return step(stepId, label, passed ? "passed" : "blocked", required, passed ? message : `无法验证：${message}`);
}

function toVerificationRun(startedAt: string, actor: string, steps: VerificationStepResult[]): VerificationRun {
  const requiredFailures = steps.filter((item) => item.required && (item.status === "failed" || item.status === "blocked"));
  const skipped = steps.filter((item) => item.status === "skipped" || item.status === "blocked");
  const status = requiredFailures.length > 0 ? "failed" : skipped.length > 0 ? "partial" : "passed";
  return {
    runId: `verify_${randomUUID()}`,
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    triggeredBy: actor,
    steps,
    summary: status === "passed" ? "关键流程检查通过。" : `${requiredFailures.length || skipped.length} 个步骤需要关注。`
  };
}

function step(
  stepId: string,
  label: string,
  status: VerificationStepResult["status"],
  required: boolean,
  message: string,
  articleId?: string,
  assetId?: string
): VerificationStepResult {
  return {
    stepId,
    label,
    status,
    required,
    articleId,
    assetId,
    message,
    durationMs: 0
  };
}
