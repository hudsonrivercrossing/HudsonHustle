import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { gameEventsTable, gameHistoryCheckpointsTable, gameSnapshotsTable, roomsTable, roomSeatsTable } from "../db/schema.js";
import type { RoomRepository, SaveRoomOptions, StoredGameHistory, StoredGameHistoryUpdate, StoredRoomRecord } from "./types.js";

/** `drizzle/` sits beside `src/` in development and beside `dist/` once built. */
const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

export class PostgresRoomRepository implements RoomRepository {
  private readonly sql: postgres.Sql;

  private readonly db: ReturnType<typeof drizzle>;

  private ready: Promise<void>;

  constructor(databaseUrl: string) {
    // `onnotice` is silenced because the idempotent baseline migration reports every table it skips.
    this.sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
    this.db = drizzle(this.sql);
    this.ready = migrate(this.db, { migrationsFolder });
  }

  /** Resolves once the schema is migrated; rejects if a migration failed. */
  whenReady(): Promise<void> {
    return this.ready;
  }

  async saveRoom(record: StoredRoomRecord, historyUpdate?: StoredGameHistoryUpdate, options?: SaveRoomOptions): Promise<void> {
    await this.ready;
    const updatedAt = new Date(record.updatedAt);
    const createdAt = new Date(record.createdAt);
    const deadlineAt = record.deadlineAt ? new Date(record.deadlineAt) : null;

    // One transaction per save: a crash or a failed statement leaves the room as it was,
    // never with its seats deleted and not yet rewritten.
    await this.db.transaction(async (tx) => {
      await tx
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

      await tx.delete(roomSeatsTable).where(eq(roomSeatsTable.roomCode, record.roomCode));
      if (record.seats.length > 0) {
        await tx.insert(roomSeatsTable).values(
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
        await tx
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
        await tx.delete(gameSnapshotsTable).where(eq(gameSnapshotsTable.roomCode, record.roomCode));
      }

      if (options?.replaceHistory) {
        await tx.delete(gameEventsTable).where(eq(gameEventsTable.roomCode, record.roomCode));
        await tx.delete(gameHistoryCheckpointsTable).where(eq(gameHistoryCheckpointsTable.roomCode, record.roomCode));
      }

      if (historyUpdate && historyUpdate.events.length > 0) {
        await tx.insert(gameEventsTable).values(
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
          await tx
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
