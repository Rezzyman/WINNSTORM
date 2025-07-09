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

// Comprehensive data structures for Winn reports
export interface RoofComponent {
  id: string;
  name: string;
  type: 'membrane' | 'insulation' | 'deck' | 'drainage' | 'flashing' | 'penetration' | 'equipment';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  installDate?: Date;
  lastInspection?: Date;
  estimatedLifespan?: number;
  notes?: string;
  images?: string[];
  thermalData?: ThermalReading[];
}

export interface ThermalReading {
  location: string;
  temperature: number;
  timestamp: Date;
  coordinates?: { x: number; y: number };
  alertLevel: 'normal' | 'caution' | 'warning' | 'critical';
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  timestamp: Date;
}

export interface InspectionMetric {
  category: string;
  subcategory: string;
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'pass' | 'fail' | 'caution';
  location?: string;
  notes?: string;
}

export interface DetailedIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'informational';
  category: string;
  location: string;
  coordinates?: { x: number; y: number };
  component?: string;
  recommendedAction: string;
  urgency: 'immediate' | 'short_term' | 'long_term' | 'monitoring';
  estimatedCost?: number;
  images?: string[];
  thermalImages?: string[];
  discoveredDate: Date;
  reportedBy: string;
}

// Additional comprehensive data structures for Winn reports
export interface BuildingInformation {
  buildingName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  buildingType: string;
  constructionYear: number;
  roofArea: number; // in square feet
  numberOfStories: number;
  occupancyType: string;
  ownerName: string;
  ownerContact: string;
  propertyManager?: string;
  propertyManagerContact?: string;
}

export interface RoofSystemDetails {
  roofType: 'flat' | 'sloped' | 'mixed';
  primaryMembrane: string;
  membraneAge: number;
  insulationType: string;
  insulationThickness: number;
  deckType: string;
  drainageType: string;
  gutterSystem: string;
  warranties: RoofWarranty[];
  previousRepairs: RepairHistory[];
}

export interface RoofWarranty {
  type: 'material' | 'labor' | 'system';
  provider: string;
  startDate: Date;
  endDate: Date;
  coverage: string;
  status: 'active' | 'expired' | 'void';
}

export interface RepairHistory {
  date: Date;
  description: string;
  contractor: string;
  cost: number;
  warrantyPeriod?: number;
  documentation?: string[];
}

export interface InspectionSection {
  sectionId: string;
  name: string;
  area: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  components: RoofComponent[];
  observations: string[];
  recommendations: string[];
  photos: string[];
  thermalImages: string[];
}

export interface CostEstimate {
  itemDescription: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  priority: 'immediate' | 'within_1_year' | 'within_5_years' | 'monitoring';
  laborHours?: number;
}

export type Scan = typeof scans.$inferSelect & {
  metrics: InspectionMetric[];
  issues: DetailedIssue[];
  roofComponents: RoofComponent[];
  weatherConditions: WeatherCondition[];
  thermalReadings: ThermalReading[];
};
export type InsertScan = z.infer<typeof insertScanSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// CRM Integration schemas
export const crmConfigs = pgTable("crm_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // User-defined name for this integration
  type: text("type").notNull(), // 'jobnimbus', 'gohighlevel', etc.
  apiKey: text("api_key").notNull(),
  baseUrl: text("base_url").notNull(),
  webhookUrl: text("webhook_url"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crmSyncLogs = pgTable("crm_sync_logs", {
  id: serial("id").primaryKey(),
  crmConfigId: integer("crm_config_id").notNull().references(() => crmConfigs.id),
  propertyId: integer("property_id").references(() => properties.id),
  scanId: integer("scan_id").references(() => scans.id),
  reportId: integer("report_id").references(() => reports.id),
  syncType: text("sync_type").notNull(), // 'contact', 'job', 'document'
  externalId: text("external_id"), // ID in the external CRM
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export const insertCrmConfigSchema = createInsertSchema(crmConfigs).pick({
  name: true,
  type: true,
  apiKey: true,
  baseUrl: true,
  webhookUrl: true,
  customFields: true,
  isActive: true,
});

export const insertCrmSyncLogSchema = createInsertSchema(crmSyncLogs).pick({
  crmConfigId: true,
  propertyId: true,
  scanId: true,
  reportId: true,
  syncType: true,
  externalId: true,
  status: true,
  errorMessage: true,
});

export type CrmConfig = typeof crmConfigs.$inferSelect;
export type InsertCrmConfig = z.infer<typeof insertCrmConfigSchema>;
export type CrmSyncLog = typeof crmSyncLogs.$inferSelect;
export type InsertCrmSyncLog = z.infer<typeof insertCrmSyncLogSchema>;
