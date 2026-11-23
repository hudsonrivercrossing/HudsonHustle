import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

/**
 * Link previews need an absolute image address. Set VITE_SITE_URL to the public origin; on Vercel
 * the production domain is picked up automatically. Without either the path stays relative, which
 * most chat apps still resolve against the page.
 */
function siteOrigin(): string {
  const explicit = process.env.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : "";
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "site-origin",
      transformIndexHtml: (html) => html.replaceAll("%SITE_ORIGIN%", siteOrigin())
    }
  ],
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
