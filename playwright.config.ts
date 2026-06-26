import { defineConfig, devices } from "@playwright/test"

process.env.E2E_TEST_PASSWORD ??= "Admin123@"

/**
 * Playwright configuration for E2E testing
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "on",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run dev:backend",
      url: "http://localhost:5000/",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "bun run dev:frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})
