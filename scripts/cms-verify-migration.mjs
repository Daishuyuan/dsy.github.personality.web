#!/usr/bin/env node
const { verifyMigration } = await import("../src/features/cms/server/migrationVerificationService.ts");

try {
  const report = await verifyMigration(process.cwd());
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ success: false, error: message }, null, 2));
  process.exit(1);
}
