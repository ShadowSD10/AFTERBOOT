import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  test: {
    include: ["tests/{unit,integration}/**/*.test.ts"],
  },
});
