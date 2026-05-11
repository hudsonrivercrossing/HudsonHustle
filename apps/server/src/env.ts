export interface ServerEnv {
  port: number;
  corsOrigin: string;
  databaseUrl: string | null;
}

function buildDatabaseUrlFromPgEnv(): string | null {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (!host || !port || !user || !password || !database) {
    return null;
  }

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

export function readServerEnv(): ServerEnv {
  return {
    port: Number(process.env.PORT ?? 8787),
    corsOrigin:
      process.env.CORS_ORIGIN ??
      "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:4173,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173",
    databaseUrl: process.env.DATABASE_URL ?? buildDatabaseUrlFromPgEnv()
  };
}
