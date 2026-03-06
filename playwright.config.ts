import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const storageStatePath =
  process.env.PLAYWRIGHT_ADMIN_STORAGE ?? "tests/e2e/.auth/admin.json";
const hasStorageState = fs.existsSync(storageStatePath);

export default defineConfig({
  testDir: path.resolve(__dirname, "tests/e2e"),
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    storageState: hasStorageState ? storageStatePath : undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_WEB_SERVER
    ? JSON.parse(process.env.PLAYWRIGHT_WEB_SERVER)
    : undefined,
});

