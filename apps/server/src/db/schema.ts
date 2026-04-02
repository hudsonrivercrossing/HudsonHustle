import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const roomsTable = pgTable("rooms", {
  roomCode: text("room_code").primaryKey(),
  status: text("status").notNull(),
  hostSeatId: text("host_seat_id").notNull(),
  playerCount: integer("player_count").notNull(),
  configId: text("config_id").notNull(),
  configVersion: text("config_version").notNull(),
  configSummary: text("config_summary").notNull(),
  mapName: text("map_name").notNull(),
  turnTimeLimitSeconds: integer("turn_time_limit_seconds").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const roomSeatsTable = pgTable(
  "room_seats",
  {
    roomCode: text("room_code").notNull(),
    seatId: text("seat_id").notNull(),
    playerId: text("player_id"),
    playerName: text("player_name"),
    playerSecret: text("player_secret").notNull(),
    controllerType: text("controller_type").notNull(),
    ready: boolean("ready").notNull(),
    connected: boolean("connected").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.roomCode, table.seatId] })
  })
);

export const gameSnapshotsTable = pgTable("game_snapshots", {
  roomCode: text("room_code").primaryKey(),
  snapshotVersion: integer("snapshot_version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const gameEventsTable = pgTable("game_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roomCode: text("room_code").notNull(),
  sequence: integer("sequence").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
