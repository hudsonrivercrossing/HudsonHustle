import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

// Tests read the rules package from source, so they never run against a stale build.
export default defineConfig({
  resolve: {
    alias: {
      "@hudson-hustle/game-core": path.resolve(here, "../game-core/src")
    }
  }
});
