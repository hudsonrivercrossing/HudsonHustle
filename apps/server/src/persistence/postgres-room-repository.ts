import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { gameEventsTable, gameSnapshotsTable, roomsTable, roomSeatsTable } from "../db/schema.js";
import type { RoomRepository, StoredRoomRecord } from "./types.js";

async function ensureSchema(sql: postgres.Sql): Promise<void> {
  await sql`
    create table if not exists rooms (
      room_code text primary key,
      status text not null,
      host_seat_id text not null,
      player_count integer not null,
      config_id text not null,
      config_version text not null,
      config_summary text not null,
      map_name text not null,
      turn_time_limit_seconds integer not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      deadline_at timestamptz
    )
  `;
  await sql`alter table rooms add column if not exists deadline_at timestamptz`;
  await sql`
    create table if not exists room_seats (
      room_code text not null,
      seat_id text not null,
      player_id text,
      player_name text,
      player_secret text not null,
      controller_type text not null,
      ready boolean not null,
      connected boolean not null,
      joined_at timestamptz not null,
      updated_at timestamptz not null,
      primary key (room_code, seat_id)
    )
  `;
  await sql`
    create table if not exists game_snapshots (
      room_code text primary key,
      snapshot_version integer not null,
      snapshot jsonb not null,
      updated_at timestamptz not null
    )
  `;
  await sql`
    create table if not exists game_events (
      id integer generated always as identity primary key,
      room_code text not null,
      sequence integer not null,
      event_type text not null,
      payload jsonb not null,
      created_at timestamptz not null
    )
  `;
}

export class PostgresRoomRepository implements RoomRepository {
  private readonly sql: postgres.Sql;

  private readonly db: ReturnType<typeof drizzle>;

  private ready: Promise<void>;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, { max: 1 });
    this.db = drizzle(this.sql);
    this.ready = ensureSchema(this.sql);
  }

  async saveRoom(record: StoredRoomRecord): Promise<void> {
    await this.ready;
    const updatedAt = new Date(record.updatedAt);
    const createdAt = new Date(record.createdAt);
    const deadlineAt = record.deadlineAt ? new Date(record.deadlineAt) : null;

    await this.db
      .insert(roomsTable)
      .values({
        roomCode: record.roomCode,
        status: record.status,
        hostSeatId: record.hostSeatId,
        playerCount: record.playerCount,
        configId: record.configId,
        configVersion: record.configVersion,
        configSummary: record.configSummary,
        mapName: record.mapName,
        turnTimeLimitSeconds: record.turnTimeLimitSeconds,
        createdAt,
        updatedAt,
        deadlineAt
      })
      .onConflictDoUpdate({
        target: roomsTable.roomCode,
        set: {
          status: record.status,
          hostSeatId: record.hostSeatId,
          playerCount: record.playerCount,
          configId: record.configId,
          configVersion: record.configVersion,
          configSummary: record.configSummary,
          mapName: record.mapName,
          turnTimeLimitSeconds: record.turnTimeLimitSeconds,
          updatedAt,
          deadlineAt
        }
      });

    await this.db.delete(roomSeatsTable).where(eq(roomSeatsTable.roomCode, record.roomCode));
    if (record.seats.length > 0) {
      await this.db.insert(roomSeatsTable).values(
        record.seats.map((seat) => ({
          roomCode: record.roomCode,
          seatId: seat.seatId,
          playerId: seat.playerId,
          playerName: seat.playerName,
          playerSecret: seat.playerSecret,
          controllerType: seat.controllerType,
          ready: seat.ready,
          connected: seat.connected,
          joinedAt: new Date(seat.joinedAt),
          updatedAt: new Date(seat.updatedAt)
        }))
      );
    }

    await this.db
      .insert(gameSnapshotsTable)
      .values({
        roomCode: record.roomCode,
        snapshotVersion: record.snapshotVersion,
        snapshot: record.game,
        updatedAt
      })
      .onConflictDoUpdate({
        target: gameSnapshotsTable.roomCode,
        set: {
          snapshotVersion: record.snapshotVersion,
          snapshot: record.game,
          updatedAt
        }
      });

    await this.db.insert(gameEventsTable).values({
      roomCode: record.roomCode,
      sequence: record.snapshotVersion,
      eventType: "room_saved",
      payload: {
        status: record.status,
        activePlayerIndex: record.game?.activePlayerIndex ?? null
      },
      createdAt: updatedAt
    });
  }

  async getRoom(roomCode: string): Promise<StoredRoomRecord | null> {
    await this.ready;

    const [room] = await this.db.select().from(roomsTable).where(eq(roomsTable.roomCode, roomCode));
    if (!room) {
      return null;
    }

    const seats = await this.db.select().from(roomSeatsTable).where(eq(roomSeatsTable.roomCode, roomCode));
    const [snapshot] = await this.db.select().from(gameSnapshotsTable).where(eq(gameSnapshotsTable.roomCode, roomCode));

    return {
      roomCode: room.roomCode,
      status: room.status as StoredRoomRecord["status"],
      hostSeatId: room.hostSeatId,
      playerCount: room.playerCount,
      configId: room.configId,
      configVersion: room.configVersion,
      configSummary: room.configSummary,
      mapName: room.mapName,
      turnTimeLimitSeconds: room.turnTimeLimitSeconds,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      deadlineAt: room.deadlineAt ? room.deadlineAt.toISOString() : null,
      snapshotVersion: snapshot?.snapshotVersion ?? 0,
      game: (snapshot?.snapshot ?? null) as StoredRoomRecord["game"],
      seats: seats.map((seat) => ({
        seatId: seat.seatId,
        playerId: seat.playerId,
        playerName: seat.playerName,
        controllerType: seat.controllerType as StoredRoomRecord["seats"][number]["controllerType"],
        ready: seat.ready,
        connected: seat.connected,
        isHost: seat.seatId === room.hostSeatId,
        playerSecret: seat.playerSecret,
        joinedAt: seat.joinedAt.toISOString(),
        updatedAt: seat.updatedAt.toISOString()
      }))
    };
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}
