import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { gameEventsTable, gameHistoryCheckpointsTable, gameSnapshotsTable, roomsTable, roomSeatsTable } from "../db/schema.js";
import type { RoomRepository, StoredGameHistory, StoredGameHistoryUpdate, StoredRoomRecord } from "./types.js";

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
      player_secret text,
      controller_type text not null,
      controller_state jsonb not null,
      ready boolean not null,
      connected boolean not null,
      joined_at timestamptz not null,
      updated_at timestamptz not null,
      primary key (room_code, seat_id)
    )
  `;
  await sql`alter table room_seats alter column player_secret drop not null`;
  await sql`alter table room_seats add column if not exists controller_state jsonb`;
  await sql`
    update room_seats
    set controller_state = '{"ownership":"client","authStrategy":"player_secret"}'::jsonb
    where controller_state is null
  `;
  await sql`alter table room_seats alter column controller_state set not null`;
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
  await sql`
    create table if not exists game_history_checkpoints (
      room_code text not null,
      snapshot_version integer not null,
      checkpoint_type text not null,
      snapshot jsonb not null,
      created_at timestamptz not null,
      primary key (room_code, snapshot_version)
    )
  `;
  await sql`
    create unique index if not exists game_events_canonical_room_sequence_idx
    on game_events (room_code, sequence)
    where event_type <> 'room_saved'
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

  async saveRoom(record: StoredRoomRecord, historyUpdate?: StoredGameHistoryUpdate): Promise<void> {
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
          controllerState: seat.controllerState,
          ready: seat.ready,
          connected: seat.connected,
          joinedAt: new Date(seat.joinedAt),
          updatedAt: new Date(seat.updatedAt)
        }))
      );
    }

    if (record.game) {
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
    } else {
      await this.db.delete(gameSnapshotsTable).where(eq(gameSnapshotsTable.roomCode, record.roomCode));
    }

    if (historyUpdate && historyUpdate.events.length > 0) {
      await this.db.insert(gameEventsTable).values(
        historyUpdate.events.map((event) => ({
          roomCode: event.roomCode,
          sequence: event.sequence,
          eventType: event.eventType,
          payload: event.payload,
          createdAt: new Date(event.createdAt)
        }))
      );
    }

    if (historyUpdate && historyUpdate.checkpoints.length > 0) {
      for (const checkpoint of historyUpdate.checkpoints) {
        await this.db
          .insert(gameHistoryCheckpointsTable)
          .values({
            roomCode: checkpoint.roomCode,
            snapshotVersion: checkpoint.snapshotVersion,
            checkpointType: checkpoint.checkpointType,
            snapshot: checkpoint.snapshot,
            createdAt: new Date(checkpoint.createdAt)
          })
          .onConflictDoNothing();
      }
    }
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
        controllerState:
          (seat.controllerState as StoredRoomRecord["seats"][number]["controllerState"]) ?? {
            ownership: "client",
            authStrategy: "player_secret"
          },
        ready: seat.ready,
        connected: seat.connected,
        isHost: seat.seatId === room.hostSeatId,
        playerSecret: seat.playerSecret,
        joinedAt: seat.joinedAt.toISOString(),
        updatedAt: seat.updatedAt.toISOString()
      }))
    };
  }

  async getGameHistory(roomCode: string): Promise<StoredGameHistory> {
    await this.ready;

    const events = await this.db.select().from(gameEventsTable).where(eq(gameEventsTable.roomCode, roomCode));
    const checkpoints = await this.db
      .select()
      .from(gameHistoryCheckpointsTable)
      .where(eq(gameHistoryCheckpointsTable.roomCode, roomCode));

    return {
      events: events
        .filter((event) => event.eventType !== "room_saved")
        .sort((left, right) => left.sequence - right.sequence || left.id - right.id)
        .map((event) => ({
          roomCode: event.roomCode,
          sequence: event.sequence,
          eventType: event.eventType as StoredGameHistory["events"][number]["eventType"],
          payload: event.payload as StoredGameHistory["events"][number]["payload"],
          createdAt: event.createdAt.toISOString()
        })),
      checkpoints: checkpoints
        .sort((left, right) => left.snapshotVersion - right.snapshotVersion)
        .map((checkpoint) => ({
          roomCode: checkpoint.roomCode,
          snapshotVersion: checkpoint.snapshotVersion,
          checkpointType: checkpoint.checkpointType as StoredGameHistory["checkpoints"][number]["checkpointType"],
          snapshot: checkpoint.snapshot as StoredGameHistory["checkpoints"][number]["snapshot"],
          createdAt: checkpoint.createdAt.toISOString()
        }))
    };
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}
