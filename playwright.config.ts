import { defineConfig, devices } from "@playwright/test";

const defaultHost = "127.0.0.1";
const defaultPort = process.env.PLAYWRIGHT_PORT ?? "4323";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${defaultHost}:${defaultPort}`;
const serverURL = process.env.PLAYWRIGHT_SERVER_URL ?? baseURL;
const serverCommand =
  process.env.PLAYWRIGHT_SERVER_COMMAND ??
  `npm run dev -- --host ${defaultHost} --port ${defaultPort}`;

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  webServer: {
    command: serverCommand,
    url: serverURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING === "true" && !process.env.CI,
    timeout: 120_000
  },
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
