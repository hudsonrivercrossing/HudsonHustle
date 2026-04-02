import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export default defineConfig({
  resolve: {
    alias: {
      "@hudson-hustle/game-core": path.resolve(currentDir, "../../packages/game-core/src"),
      "@hudson-hustle/game-data": path.resolve(currentDir, "../../packages/game-data/src")
    }
  },
  test: {
    include: ["tests/**/*.test.ts"]
  }
});
