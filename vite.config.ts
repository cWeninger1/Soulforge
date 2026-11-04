import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  optimizeDeps: { entries: ["src/**/*.{ts,tsx}"] },
  plugins: [react()],
  test: { include: ["tests/**/*.test.{ts,tsx}"] },
});
