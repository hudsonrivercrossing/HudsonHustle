import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  resolve: {
    alias: {
      "@hudson-hustle/game-core": path.resolve(currentDir, "../../packages/game-core/src"),
      "@hudson-hustle/game-data": path.resolve(currentDir, "../../packages/game-data/src")
    }
  }
});
