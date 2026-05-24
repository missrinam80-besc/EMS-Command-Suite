import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_TENANT_BASE_URL;

if (!baseURL) {
  throw new Error("E2E_TENANT_BASE_URL ontbreekt voor tenant-isolatie tests.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["cross-tenant-isolation.spec.ts", "delegated-admin-permissions.spec.ts"],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
