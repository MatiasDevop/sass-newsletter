import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    globals: true,
    include: ["__tests__/**/*.test.{ts,tsx}", "__tests__/**/*.spec.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["**/*.{ts,tsx}"],
      exclude: ["node_modules", ".next/**", "public/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
})
