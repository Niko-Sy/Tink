import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:11451",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
  webServer: [
    {
      command: "go run ./cmd/dev-social",
      cwd: fileURLToPath(new URL("../Tink-Backend", import.meta.url)),
      url: "http://127.0.0.1:18080/health/db",
      timeout: 120000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    },
    {
      command: "npm run dev:social",
      url: "http://127.0.0.1:11451",
      timeout: 30000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    },
  ],
});
