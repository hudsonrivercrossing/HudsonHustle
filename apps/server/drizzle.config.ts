import { defineConfig } from "drizzle-kit";

// Used only to generate migration files from the schema: `pnpm --filter @hudson-hustle/server db:generate`.
// The server applies the generated files itself at startup, so no database URL is needed here.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle"
});
