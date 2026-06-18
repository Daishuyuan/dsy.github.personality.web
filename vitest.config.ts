import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/features/visual-algorithms/tests/**/*.test.ts"],
    globals: true
  }
});
