import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

// Property Schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  imageUrl: text("image_url"),
  healthScore: integer("health_score").default(0),
  lastScanDate: timestamp("last_scan_date"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  name: true,
  address: true,
  imageUrl: true,
  userId: true,
});

// Scan Schema
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  scanType: text("scan_type").notNull(), // 'drone' or 'handheld'
  deviceType: text("device_type"),
  standardImageUrl: text("standard_image_url"),
  thermalImageUrl: text("thermal_image_url").notNull(),
  healthScore: integer("health_score").notNull(),
  metrics: jsonb("metrics").notNull(),
  issues: jsonb("issues").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertScanSchema = createInsertSchema(scans).pick({
  propertyId: true,
  scanType: true,
  deviceType: true,
  standardImageUrl: true,
  thermalImageUrl: true,
  notes: true,
  userId: true,
});

// Report Schema
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => scans.id).notNull(),
  title: text("title").notNull(),
  pdfUrl: text("pdf_url"),
  sentTo: text("sent_to"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  scanId: true,
  title: true,
  pdfUrl: true,
  sentTo: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect & {
  scans?: Scan[];
  reports?: Report[];
};
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export interface Metric {
  name: string;
  value: number;
}

export interface Issue {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  location?: string;
}

export type Scan = typeof scans.$inferSelect & {
  metrics: Metric[];
  issues: Issue[];
};
export type InsertScan = z.infer<typeof insertScanSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
