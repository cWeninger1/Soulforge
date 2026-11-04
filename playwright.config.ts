import { defineConfig } from "@playwright/test";
export default defineConfig({
  workers: 1,
  timeout: 60000,
  testDir: "tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "msedge",
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    command:
      "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort" +
      (process.env.FIRESTORE_EMULATOR_HOST ? " --mode emulator" : ""),
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
