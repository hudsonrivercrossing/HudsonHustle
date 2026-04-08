import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4173"
  },
  webServer: [
    {
      command:
        "DATABASE_URL= PGHOST= PGPORT= PGUSER= PGPASSWORD= PGDATABASE= pnpm --filter @hudson-hustle/server build && DATABASE_URL= PGHOST= PGPORT= PGUSER= PGPASSWORD= PGDATABASE= pnpm --filter @hudson-hustle/server start",
      port: 8787,
      reuseExistingServer: true
    },
    {
      command: "pnpm --filter @hudson-hustle/web dev --host 127.0.0.1 --port 4173",
      port: 4173,
      reuseExistingServer: true
    }
  ]
});
