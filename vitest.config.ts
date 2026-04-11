import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.join(__dirname, "tests/setup.ts")],
    include: ["tests/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**", "app/api/**", "components/**"],
      exclude: ["**/*.test.ts", "tests/**"],
    },
  },
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
});
