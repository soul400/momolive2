import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Stream schema
export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name"),
  status: text("status").notNull().default("pending"), // pending, recording, completed, error
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const insertStreamSchema = createInsertSchema(streams).pick({
  url: true,
  name: true,
});

export type InsertStream = z.infer<typeof insertStreamSchema>;
export type Stream = typeof streams.$inferSelect;

// Segment schema
export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  duration: integer("duration").notNull(), // in seconds
  position: integer("position").notNull(), // order in the stream
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSegmentSchema = createInsertSchema(segments).pick({
  streamId: true,
  filePath: true,
  fileName: true,
  duration: true,
  position: true,
  thumbnail: true,
});

export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type Segment = typeof segments.$inferSelect;
