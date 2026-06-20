#!/usr/bin/env node
const { importLocalArticles } = await import("../src/features/cms/server/importLocalService.ts");

const mode = process.argv.includes("--apply") ? "apply" : "dry-run";
try {
  const report = await importLocalArticles(process.cwd(), mode);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
}
