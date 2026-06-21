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
});
