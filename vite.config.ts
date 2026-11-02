import { defineConfig } from "vitest/config";

export default defineConfig({
  // GitHub Pages builds pass /Focus-Board/; relative is safe for local previews.
  base: process.env.VITE_BASE_PATH ?? "./",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
