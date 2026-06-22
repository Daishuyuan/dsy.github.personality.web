import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminAppSource = readFileSync(
  fileURLToPath(new URL("../admin/AdminApp.vue", import.meta.url)),
  "utf8"
);

describe("CMS admin view switching", () => {
  it("keeps the article editor out of operations tabs", () => {
    expect(adminAppSource).toContain('v-if="activeView === \'articles\'" class="cms-layout"');
    expect(adminAppSource).toContain('v-if="activeView !== \'articles\'" class="operations-panel"');
  });

  it("keeps the login shell in loading state until auth initialization finishes", () => {
    expect(adminAppSource).toContain('v-if="!authInitialized" class="auth-loading"');
    expect(adminAppSource).toContain('v-else title="未配置 Google 登录。"');
    expect(adminAppSource).toContain("authInitialized.value = true");
  });
});
