export interface ServerEnv {
  port: number;
  corsOrigin: string;
  databaseUrl: string | null;
  /** Rooms one address may create per minute. Raised for the end-to-end suite, which creates many from one machine. */
  roomCreateLimitPerMinute: number;
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

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function readServerEnv(): ServerEnv {
  return {
    port: Number(process.env.PORT ?? 8787),
    corsOrigin:
      process.env.CORS_ORIGIN ??
      "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:4173,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173",
    databaseUrl: process.env.DATABASE_URL ?? buildDatabaseUrlFromPgEnv(),
    roomCreateLimitPerMinute: positiveInt(process.env.ROOM_CREATE_LIMIT_PER_MINUTE, 10)
  };
}
