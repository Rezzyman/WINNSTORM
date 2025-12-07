import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema - Updated for WinnStorm™ Consultant Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role"), // 'junior_consultant', 'senior_consultant', 'admin', 'client'
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  certificationLevel: text("certification_level"), // 'junior', 'senior', 'none'
  certificationDate: timestamp("certification_date"),
  certificationExpiry: timestamp("certification_expiry"),
  inspectionHours: integer("inspection_hours").default(0),
  approvedDARs: integer("approved_dars").default(0),
  trainingProgress: jsonb("training_progress").$type<TrainingProgress>(),
  performanceMetrics: jsonb("performance_metrics").$type<PerformanceMetrics>(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  certificationLevel: true,
});

// Client Schema for WinnStorm™ CRM
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id), // Consultant who added client
});

// Project Schema - Core project management for damage assessments
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(), // Custom project identifier
  clientId: integer("client_id").references(() => clients.id).notNull(),
  propertyAddress: text("property_address").notNull(),
  lossType: text("loss_type").notNull(), // 'hail', 'wind', 'hurricane', 'flood', etc.
  dateOfLoss: timestamp("date_of_loss").notNull(),
  inspectionDate: timestamp("inspection_date"),
  reportDueDate: timestamp("report_due_date"),
  submissionDate: timestamp("submission_date"),
  approvalDate: timestamp("approval_date"),
  status: text("status").notNull(), // 'prospecting', 'inspection_scheduled', 'report_draft', 'submitted_to_insurance', 'approved', 'denied', 'completed'
  estimatedValue: integer("estimated_value"), // in cents
  approvedAmount: integer("approved_amount"), // in cents
  assignedConsultantId: integer("assigned_consultant_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Schema - Updated for WinnStorm™ damage assessment
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  buildingInfo: jsonb("building_info").$type<BuildingInformation>(),
  roofSystemDetails: jsonb("roof_system_details").$type<RoofSystemDetails>(),
  imageUrl: text("image_url"),
  overallCondition: text("overall_condition"), // 'excellent', 'good', 'fair', 'poor', 'critical'
  lastInspectionDate: timestamp("last_inspection_date"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  companyName: true,
  contactPerson: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  userId: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  projectId: true,
  clientId: true,
  propertyAddress: true,
  lossType: true,
  dateOfLoss: true,
  inspectionDate: true,
  reportDueDate: true,
  status: true,
  estimatedValue: true,
  assignedConsultantId: true,
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  projectId: true,
  name: true,
  address: true,
  buildingInfo: true,
  roofSystemDetails: true,
  imageUrl: true,
  overallCondition: true,
  userId: true,
});

// Scans Schema - Thermal and inspection data
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  date: timestamp("date").notNull(),
  scanType: text("scan_type").notNull(), // 'drone', 'handheld', 'terrestrial'
  deviceType: text("device_type"),
  standardImageUrl: text("standard_image_url"),
  thermalImageUrl: text("thermal_image_url"),
  healthScore: integer("health_score"),
  metrics: jsonb("metrics").$type<Metric[]>(),
  issues: jsonb("issues").$type<Issue[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertScanSchema = createInsertSchema(scans).pick({
  propertyId: true,
  date: true,
  scanType: true,
  deviceType: true,
  standardImageUrl: true,
  thermalImageUrl: true,
  healthScore: true,
  metrics: true,
  issues: true,
  notes: true,
  userId: true,
});

// Training Courses Schema for WinnStorm™ Certification
export const trainingCourses = pgTable("training_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  day: text("day"), // 'orientation', 'day1', 'day2', etc.
  subject: text("subject"), // 'technology', 'inspections', 'sales', 'insurance', etc.
  contentType: text("content_type"), // 'video', 'text', 'document', 'external_link'
  contentUrl: text("content_url"),
  duration: integer("duration"), // in minutes
  requiredForCertification: boolean("required_for_certification").default(false),
  certificationLevel: text("certification_level"), // 'junior', 'senior', 'both'
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Quizzes Schema
export const trainingQuizzes = pgTable("training_quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => trainingCourses.id),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").default(85), // percentage
  questions: jsonb("questions").$type<QuizQuestion[]>().notNull(),
  timeLimit: integer("time_limit"), // in minutes
  maxAttempts: integer("max_attempts").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Training Progress Schema
export const userTrainingProgress = pgTable("user_training_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => trainingCourses.id).notNull(),
  quizId: integer("quiz_id").references(() => trainingQuizzes.id),
  status: text("status").notNull(), // 'not_started', 'in_progress', 'completed', 'failed'
  score: integer("score"), // percentage for quizzes
  attempts: integer("attempts").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Damage Assessment Reports Schema - Core WinnStorm™ functionality
export const damageAssessments = pgTable("damage_assessments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  inspectorId: integer("inspector_id").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // 'initial_dar', 'v2_comprehensive_dar', 'proof_of_loss', 'winn_report'
  weatherData: jsonb("weather_data").$type<WeatherVerificationData>(),
  thermalData: jsonb("thermal_data").$type<ThermalInspectionData>(),
  terrestrialWalk: jsonb("terrestrial_walk").$type<TerrestrialWalkData>(),
  testSquares: jsonb("test_squares").$type<TestSquareData[]>(),
  softMetals: jsonb("soft_metals").$type<SoftMetalData[]>(),
  moistureTests: jsonb("moisture_tests").$type<MoistureTestData[]>(),
  coreSamples: jsonb("core_samples").$type<CoreSampleData[]>(),
  damageFindings: jsonb("damage_findings").$type<DamageFindings>(),
  repairAnalysis: jsonb("repair_analysis").$type<RepairAnalysis>(),
  codeCompliance: jsonb("code_compliance").$type<CodeComplianceData>(),
  photos: jsonb("photos").$type<AssessmentPhotos>(),
  status: text("status").notNull(), // 'in_progress', 'review', 'completed', 'submitted'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for the new tables
export const insertTrainingCourseSchema = createInsertSchema(trainingCourses).pick({
  title: true,
  description: true,
  day: true,
  subject: true,
  contentType: true,
  contentUrl: true,
  duration: true,
  requiredForCertification: true,
  certificationLevel: true,
  orderIndex: true,
});

export const insertTrainingQuizSchema = createInsertSchema(trainingQuizzes).pick({
  courseId: true,
  title: true,
  description: true,
  passingScore: true,
  questions: true,
  timeLimit: true,
  maxAttempts: true,
});

export const insertUserTrainingProgressSchema = createInsertSchema(userTrainingProgress).pick({
  userId: true,
  courseId: true,
  quizId: true,
  status: true,
  score: true,
  attempts: true,
  startedAt: true,
  completedAt: true,
});

export const insertDamageAssessmentSchema = createInsertSchema(damageAssessments).pick({
  projectId: true,
  propertyId: true,
  inspectionDate: true,
  inspectorId: true,
  reportType: true,
  weatherData: true,
  thermalData: true,
  terrestrialWalk: true,
  testSquares: true,
  softMetals: true,
  moistureTests: true,
  coreSamples: true,
  damageFindings: true,
  repairAnalysis: true,
  codeCompliance: true,
  photos: true,
  status: true,
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

// Basic scan data types
export interface Metric {
  name: string;
  value: number;
}

export interface Issue {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

// WinnStorm™ Training and Assessment Types
export interface TrainingProgress {
  coursesCompleted: number;
  totalCourses: number;
  quizzesPassed: number;
  totalQuizzes: number;
  currentLevel: 'junior' | 'senior';
  certificationEligible: boolean;
}

export interface PerformanceMetrics {
  inspectionHours: number;
  approvedDARs: number;
  averageReportQuality: number;
  clientSatisfaction: number;
  revenueGenerated: number;
  conversionRate: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

// Weather Verification Data - Core WinnStorm™ requirement
export interface WeatherVerificationData {
  hailTraceData: HailTraceData;
  noaaData: NOAAData;
  newsReports: NewsReport[];
  socialMediaReports: SocialMediaReport[];
  ownerPhotos: string[];
  hailReconData: HailReconData;
  verificationTier: 'tier1_verified_spotter' | 'meteorologist_verified' | 'impact_report_ai';
  verificationSources: string[];
}

export interface HailTraceData {
  stormDate: string;
  stormPath: string;
  maxHailSize: number;
  windSpeed: number;
  verifiedSpotter: boolean;
  reportId: string;
}

export interface NOAAData {
  stormReportId: string;
  location: string;
  hailSize: number;
  windSpeed: number;
  reportTime: string;
  verification: string;
}

export interface NewsReport {
  source: string;
  headline: string;
  date: string;
  url: string;
  relevantQuotes: string[];
}

export interface SocialMediaReport {
  platform: string;
  postUrl: string;
  content: string;
  images: string[];
  timestamp: string;
  verification: string;
}

export interface HailReconData {
  reportId: string;
  location: string;
  hailSize: number;
  confidence: number;
  radarData: string;
}

// Thermal Inspection Data
export interface ThermalInspectionData {
  thermalLoadObservations: string[];
  dryRoofStatus: boolean;
  moistureMapMosaic: string; // URL to thermal image
  irxMap: string; // URL to IRX map
  emissivitySettings: number;
  thermalOrthoMaps: string[];
  flightPlans: string[];
  temperatureReadings: ThermalReading[];
}

// Terrestrial Walk Data
export interface TerrestrialWalkData {
  buildingLabels: BuildingLabel[];
  moistureAreas: MoistureArea[];
  featureMarkers: FeatureMarker[];
  damageMarkers: DamageMarker[];
  walkPath: string; // GPS coordinates or route description
}

export interface BuildingLabel {
  id: string;
  label: string; // e.g., "#1", "#2", "R17", "R18"
  coordinates: { x: number; y: number };
  sectionType: string;
}

export interface MoistureArea {
  id: string;
  coordinates: { x: number; y: number };
  size: string; // e.g., "2'x2'"
  severity: 'low' | 'medium' | 'high';
  arrowDirection: string;
  paintColor: 'blue';
}

export interface FeatureMarker {
  id: string;
  coordinates: { x: number; y: number };
  label: string; // e.g., "1 HV 1", "1 D1"
  featureType: 'hvac' | 'drain' | 'vent' | 'electrical' | 'satellite' | 'other';
  paintColor: 'orange';
}

export interface DamageMarker {
  id: string;
  coordinates: { x: number; y: number };
  damageType: 'moisture_entry' | 'hole' | 'damaged_seam' | 'lifted_membrane' | 'flashing_damage' | 'blister' | 'debris_strike';
  severity: 'minor' | 'moderate' | 'severe';
  paintColor: 'pink';
}

// Test Square Data
export interface TestSquareData {
  id: string;
  location: string;
  sectionId: string;
  size: '10x10'; // standard size
  totalImpacts: number;
  individualImpacts: ImpactMarker[];
  photos: string[];
}

export interface ImpactMarker {
  id: string;
  coordinates: { x: number; y: number };
  diameter: number; // in inches
  depth: number; // in inches
  label: string; // pink L marking
}

// Soft Metal Data
export interface SoftMetalData {
  id: string;
  type: 'parapet_cap' | 'coping' | 'flashing' | 'gutter';
  location: string;
  squareFootage: number;
  impactCount: number;
  impactSizes: number[]; // array of impact diameters
  copingSize?: string;
  labelConvention: string;
  photos: string[];
}

// Moisture Test Data
export interface MoistureTestData {
  id: string;
  location: string;
  sectionId: string;
  testNumber: number;
  moisturePercentage: number;
  testArea: '2x2'; // 2'x2' square
  labelHeight: '2ft'; // 2ft tall letters
  tramexReading: number;
  photos: string[];
}

// Core Sample Data
export interface CoreSampleData {
  id: string;
  location: string;
  sampleArea: '2x2'; // 2'x2' location
  cutSize: '1x1'; // 1'x1' cut on 3 sides
  insulationDepth: number;
  insulationLayers: InsulationLayer[];
  deckingType: string;
  prickTest: string;
  layerPhotos: string[];
  centerCutPhoto: string;
  hailImpactPhoto: string;
  insulationFracturePhoto: string;
  membraneDamageTop: string;
  membraneDamageBottom: string;
  pullTestResults: string;
  taperDrainage: string;
}

export interface InsulationLayer {
  layerNumber: number;
  material: string;
  thickness: number;
  condition: string;
  rValue: number;
}

// Damage Findings
export interface DamageFindings {
  damageType: 'hail' | 'wind' | 'hurricane' | 'flood';
  roofSystemType: 'metal' | 'mod_bit' | 'epdm' | 'shingle' | 'tpo' | 'pvc';
  overallCondition: 'no_damage' | 'minor' | 'moderate' | 'severe' | 'total_loss';
  damageAreas: DamageArea[];
  impactDensity: number; // impacts per square foot
  totalDamageSquareFootage: number;
}

export interface DamageArea {
  id: string;
  location: string;
  damageType: string;
  severity: 'minor' | 'moderate' | 'severe';
  squareFootage: number;
  description: string;
  photos: string[];
}

// Repair Analysis
export interface RepairAnalysis {
  repairFeasibility: 'repair' | 'replace';
  reasoning: string;
  waterSaturation: boolean;
  discontinuedMaterials: boolean;
  emsRequirements: string[];
  preLossConditionRestoration: boolean;
  estimatedRepairCost: number;
  estimatedReplacementCost: number;
  recommendation: string;
}

// Code Compliance Data
export interface CodeComplianceData {
  buildingCodes: BuildingCodeReference[];
  laws: LegalReference[];
  statutesOfLimitations: string;
  manufacturerSpecs: ManufacturerSpec[];
  technicalBulletins: TechnicalBulletin[];
  permitHistory: PermitRecord[];
  foiaRequests: FOIARequest[];
}

export interface BuildingCodeReference {
  code: string;
  section: string;
  description: string;
  relevance: string;
}

export interface LegalReference {
  statute: string;
  description: string;
  applicability: string;
}

export interface ManufacturerSpec {
  manufacturer: string;
  product: string;
  specification: string;
  requirement: string;
}

export interface TechnicalBulletin {
  bulletinNumber: string;
  title: string;
  relevantSection: string;
}

export interface PermitRecord {
  permitNumber: string;
  issueDate: string;
  type: string;
  description: string;
  status: string;
}

export interface FOIARequest {
  requestId: string;
  agency: string;
  requestDate: string;
  response: string;
  documents: string[];
}

// Assessment Photos
export interface AssessmentPhotos {
  overview: OverviewPhotos;
  midRange: MidRangePhotos;
  closeUp: CloseUpPhotos;
  microscope: MicroscopePhotos;
  drone: DronePhotos;
  videos: VideoFiles[];
}

export interface OverviewPhotos {
  fromCenter: string[];
  fromCorners: string[];
  testSquareOverview: string[];
  frontRearBackLeft: string[];
}

export interface MidRangePhotos {
  approaching: string[];
  closer: string[];
}

export interface CloseUpPhotos {
  individualImpacts: ImpactPhoto[];
  precisionSquare: string[];
  zoomed5x: string[];
  zoomed10x: string[];
  zoomed15x: string[];
}

export interface ImpactPhoto {
  url: string;
  impactId: string;
  measurements: string;
  annotations: PhotoAnnotation[];
}

export interface MicroscopePhotos {
  impacts: string[];
  materialDetail: string[];
}

export interface DronePhotos {
  orthoReports: string[];
  naderTopographical: string[];
  oblique3DModel: string[];
  orbitalPerSection: string[];
}

export interface VideoFiles {
  url: string;
  type: 'inspection' | 'overview' | 'damage_detail';
  duration: number;
  description: string;
}

export interface PhotoAnnotation {
  type: 'circle' | 'arrow' | 'label' | 'measurement';
  color: 'yellow' | 'pink' | 'blue' | 'orange';
  coordinates: { x: number; y: number };
  text?: string;
  measurements?: string;
}

// Types
export type User = typeof users.$inferSelect & {
  trainingProgress?: TrainingProgress;
  performanceMetrics?: PerformanceMetrics;
};
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect & {
  client?: Client;
  property?: Property;
  assessments?: DamageAssessment[];
};
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Property = typeof properties.$inferSelect & {
  project?: Project;
  buildingInfo?: BuildingInformation;
  roofSystemDetails?: RoofSystemDetails;
  assessments?: DamageAssessment[];
};
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type TrainingCourse = typeof trainingCourses.$inferSelect;
export type InsertTrainingCourse = z.infer<typeof insertTrainingCourseSchema>;

export type TrainingQuiz = typeof trainingQuizzes.$inferSelect & {
  questions: QuizQuestion[];
};
export type InsertTrainingQuiz = z.infer<typeof insertTrainingQuizSchema>;

export type UserTrainingProgress = typeof userTrainingProgress.$inferSelect;
export type InsertUserTrainingProgress = z.infer<typeof insertUserTrainingProgressSchema>;

export type DamageAssessment = typeof damageAssessments.$inferSelect & {
  project?: Project;
  property?: Property;
  inspector?: User;
  weatherData?: WeatherVerificationData;
  thermalData?: ThermalInspectionData;
  terrestrialWalk?: TerrestrialWalkData;
  testSquares?: TestSquareData[];
  softMetals?: SoftMetalData[];
  moistureTests?: MoistureTestData[];
  coreSamples?: CoreSampleData[];
  damageFindings?: DamageFindings;
  repairAnalysis?: RepairAnalysis;
  codeCompliance?: CodeComplianceData;
  photos?: AssessmentPhotos;
};
export type InsertDamageAssessment = z.infer<typeof insertDamageAssessmentSchema>;

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

// Roof Section Interface for Google Maps Drawing
export interface RoofSection {
  id: string;
  number: number;
  type: 'polygon' | 'rectangle' | 'circle';
  coordinates: any[];
  area?: number;
  label: string;
  notes: string;
}

// Additional comprehensive data structures for Winn reports
export interface BuildingInformation {
  address: string;
  propertyType: 'commercial' | 'residential' | 'industrial' | 'institutional';
  yearBuilt: number;
  squareFootage: number;
  stories: number;
  occupancy: string;
  ownerName: string;
  ownerContact: string;
  roofSections: RoofSection[];
}

export interface RoofSystemDetails {
  roofType: 'flat' | 'sloped' | 'mixed';
  primaryMaterial: 'membrane' | 'shingle' | 'metal' | 'tile' | 'other';
  age: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  previousRepairs: string[];
  warrantyInfo: string;
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

// Knowledge Base Schema - Eric Winn Methodology Documentation
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'procedure', 'decision_tree', 'terminology', 'best_practice', 'common_mistake'
  title: text("title").notNull(),
  content: text("content").notNull(), // Full text content
  tags: text("tags").array(), // Searchable tags
  workflowStep: text("workflow_step"), // Maps to inspection workflow steps (weather, thermal, terrestrial, etc.)
  difficulty: text("difficulty"), // 'beginner', 'intermediate', 'expert'
  relatedIds: integer("related_ids").array(), // Links to related knowledge entries
  videoUrl: text("video_url"), // Link to Eric's video demonstrations
  imageUrls: text("image_urls").array(), // Reference images
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).pick({
  category: true,
  title: true,
  content: true,
  tags: true,
  workflowStep: true,
  difficulty: true,
  relatedIds: true,
  videoUrl: true,
  imageUrls: true,
  createdBy: true,
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

// ============================================================================
// MULTIMODAL INSPECTION COACH - Eric Winn Methodology State Machine
// ============================================================================

// Winn Methodology Steps (strict sequential order)
export const WINN_METHODOLOGY_STEPS = [
  'weather_verification',
  'thermal_imaging', 
  'terrestrial_walk',
  'test_squares',
  'soft_metals',
  'moisture_testing',
  'core_samples',
  'report_assembly'
] as const;

export type WinnMethodologyStep = typeof WINN_METHODOLOGY_STEPS[number];

// Step requirements and gating rules
export interface StepRequirements {
  minPhotos: number;
  requiredFields: string[];
  aiValidationRequired: boolean;
  canSkip: boolean;
  skipReasons?: string[];
}

// AI validation result for each step
export interface AIStepValidation {
  isValid: boolean;
  confidence: number;
  findings: string[];
  recommendations: string[];
  warnings: string[];
  analysisTimestamp: string;
}

// Evidence Asset - Photos, thermal images, transcripts with GPT analysis
export const evidenceAssets = pgTable("evidence_assets", {
  id: serial("id").primaryKey(),
  inspectionSessionId: integer("inspection_session_id").notNull(),
  step: text("step").notNull(), // Which methodology step this evidence belongs to
  assetType: text("asset_type").notNull(), // 'photo', 'thermal', 'audio', 'transcript', 'document'
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  caption: text("caption"),
  location: text("location"), // GPS or description of where on property
  aiAnalysis: jsonb("ai_analysis").$type<AIStepValidation>(),
  rawAiResponse: text("raw_ai_response"), // Full GPT response for debugging
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible metadata (EXIF, thermal calibration, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

// Inspection Session - State machine tracking progress through methodology
export const inspectionSessions = pgTable("inspection_sessions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  inspectorId: integer("inspector_id").references(() => users.id).notNull(),
  
  // State machine
  status: text("status").notNull().default('in_progress'), // 'not_started', 'in_progress', 'paused', 'completed', 'abandoned'
  currentStep: text("current_step").notNull().default('weather_verification'), // Current step in WINN_METHODOLOGY_STEPS
  
  // Step completion tracking
  stepsCompleted: text("steps_completed").array().default([]), // Array of completed step names
  stepData: jsonb("step_data").$type<Record<WinnMethodologyStep, StepData>>(), // Data collected at each step
  stepValidations: jsonb("step_validations").$type<Record<WinnMethodologyStep, AIStepValidation>>(), // AI validations per step
  
  // Compliance tracking
  overrides: jsonb("overrides").$type<StepOverride[]>(), // When inspector skips steps with reason
  complianceScore: integer("compliance_score"), // 0-100 based on methodology adherence
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  
  // AI coaching context
  stormyConversation: jsonb("stormy_conversation").$type<ConversationMessage[]>(), // Chat history for context
  aiRecommendations: text("ai_recommendations").array(), // Current coaching tips
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Step data collected during inspection
export interface StepData {
  completed: boolean;
  completedAt?: string;
  evidenceCount: number;
  notes: string;
  findings: string[];
  measurements?: Record<string, any>; // Step-specific measurements
}

// Override record when inspector skips a step
export interface StepOverride {
  step: WinnMethodologyStep;
  reason: string;
  timestamp: string;
  approvedBy?: number; // Senior consultant ID if escalated
}

// Stormy conversation message
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  step?: WinnMethodologyStep; // Which step this message relates to
  evidenceRef?: number; // Reference to evidence asset if discussing an image
}

// Inspector Progress - Long-term performance tracking
export const inspectorProgress = pgTable("inspector_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Aggregate metrics
  totalInspections: integer("total_inspections").default(0),
  completedInspections: integer("completed_inspections").default(0),
  averageComplianceScore: integer("average_compliance_score"),
  
  // Per-step proficiency
  stepProficiency: jsonb("step_proficiency").$type<Record<WinnMethodologyStep, StepProficiency>>(),
  
  // Knowledge gaps identified by AI
  knowledgeGaps: text("knowledge_gaps").array(), // Topics needing improvement
  recommendedTraining: text("recommended_training").array(), // Course IDs
  
  // Achievements
  certificationsEarned: text("certifications_earned").array(),
  lastAssessmentDate: timestamp("last_assessment_date"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proficiency tracking per methodology step
export interface StepProficiency {
  attemptCount: number;
  averageTimeMinutes: number;
  aiInterventionCount: number;
  overrideCount: number;
  lastAttempt: string;
  proficiencyLevel: 'novice' | 'learning' | 'competent' | 'proficient' | 'expert';
}

// Zod schemas for compliance API validation
export const recordStepPayloadSchema = z.object({
  step: z.enum(WINN_METHODOLOGY_STEPS),
  timeSpentMinutes: z.number().min(0).optional(),
  aiInterventions: z.number().min(0).optional(),
  wasOverridden: z.boolean().optional(),
});
export type RecordStepPayload = z.infer<typeof recordStepPayloadSchema>;

export const recordOverridePayloadSchema = z.object({
  sessionId: z.string(),
  step: z.enum(WINN_METHODOLOGY_STEPS),
  reason: z.string().min(5, 'Override reason must be at least 5 characters'),
});
export type RecordOverridePayload = z.infer<typeof recordOverridePayloadSchema>;

// Limitless Transcript - For ingesting Eric Winn recordings
export const limitlessTranscripts = pgTable("limitless_transcripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  rawTranscript: text("raw_transcript").notNull(), // Full transcript text
  duration: integer("duration"), // Recording duration in seconds
  recordingDate: timestamp("recording_date"),
  
  // AI-parsed content
  parsedSegments: jsonb("parsed_segments").$type<TranscriptSegment[]>(),
  extractedKnowledge: jsonb("extracted_knowledge").$type<ExtractedKnowledge[]>(),
  
  // Review status
  status: text("status").notNull().default('pending'), // 'pending', 'processing', 'reviewed', 'approved', 'rejected'
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  
  // Integration
  knowledgeEntriesCreated: integer("knowledge_entries_created").array(), // IDs of knowledge_base entries created
  
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parsed segment from transcript
export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  speaker?: string;
  text: string;
  topic?: string; // AI-classified topic
  methodologyStep?: WinnMethodologyStep; // Which step this relates to
  confidence: number;
}

// Knowledge extracted from transcript for review
export interface ExtractedKnowledge {
  category: 'procedure' | 'decision_tree' | 'terminology' | 'best_practice' | 'common_mistake';
  title: string;
  content: string;
  sourceSegments: number[]; // Indices into parsedSegments
  suggestedTags: string[];
  suggestedStep: WinnMethodologyStep;
  confidence: number;
  approved?: boolean;
}

// Insert schemas
export const insertEvidenceAssetSchema = createInsertSchema(evidenceAssets).pick({
  inspectionSessionId: true,
  step: true,
  assetType: true,
  filename: true,
  fileUrl: true,
  mimeType: true,
  fileSize: true,
  caption: true,
  location: true,
  aiAnalysis: true,
  rawAiResponse: true,
  metadata: true,
  uploadedBy: true,
});

export const insertInspectionSessionSchema = createInsertSchema(inspectionSessions).pick({
  propertyId: true,
  inspectorId: true,
  status: true,
  currentStep: true,
});

export const insertInspectorProgressSchema = createInsertSchema(inspectorProgress).pick({
  userId: true,
});

export const insertLimitlessTranscriptSchema = createInsertSchema(limitlessTranscripts).pick({
  title: true,
  rawTranscript: true,
  duration: true,
  recordingDate: true,
  uploadedBy: true,
});

// ============================================================================
// SCHEDULED INSPECTIONS
// ============================================================================

export interface ScheduledPropertyDetails {
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  accessInstructions?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface RouteOptimizationData {
  orderIndex: number;
  distanceFromPrevious?: number;
  estimatedTravelTime?: number;
  estimatedArrival?: string;
}

export const scheduledInspections = pgTable("scheduled_inspections", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  inspectorId: integer("inspector_id").references(() => users.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  estimatedDuration: integer("estimated_duration").default(60),
  status: text("status").notNull().default('scheduled'),
  priority: text("priority").notNull().default('normal'),
  notes: text("notes"),
  accessInstructions: text("access_instructions"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  routeOptimization: jsonb("route_optimization").$type<RouteOptimizationData>(),
  reminderSent: boolean("reminder_sent").default(false),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScheduledInspectionSchema = createInsertSchema(scheduledInspections).omit({
  id: true,
  routeOptimization: true,
  reminderSent: true,
  completedAt: true,
  cancelledAt: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
});

// Team Assignments for workload balancing
export const teamAssignments = pgTable("team_assignments", {
  id: serial("id").primaryKey(),
  inspectorId: integer("inspector_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id),
  teamName: text("team_name"),
  region: text("region"),
  maxDailyInspections: integer("max_daily_inspections").default(4),
  maxWeeklyInspections: integer("max_weekly_inspections").default(20),
  skillLevel: text("skill_level").default('standard'),
  specializations: text("specializations").array().default([]),
  isAvailable: boolean("is_available").default(true),
  unavailableUntil: timestamp("unavailable_until"),
  unavailableReason: text("unavailable_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamAssignmentSchema = createInsertSchema(teamAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Damage Templates for quick application during inspections
export interface DamageTemplateRecommendation {
  action: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  estimatedCost?: string;
}

export const damageTemplates = pgTable("damage_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  damageType: text("damage_type").notNull(),
  description: text("description").notNull(),
  defaultSeverity: text("default_severity").notNull().default('warning'),
  affectedComponents: text("affected_components").array().default([]),
  typicalCauses: text("typical_causes").array().default([]),
  recommendations: jsonb("recommendations").$type<DamageTemplateRecommendation[]>(),
  inspectionNotes: text("inspection_notes"),
  requiredEvidence: text("required_evidence").array().default([]),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDamageTemplateSchema = createInsertSchema(damageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type EvidenceAsset = typeof evidenceAssets.$inferSelect;
export type InsertEvidenceAsset = z.infer<typeof insertEvidenceAssetSchema>;
export type InspectionSession = typeof inspectionSessions.$inferSelect;
export type InsertInspectionSession = z.infer<typeof insertInspectionSessionSchema>;
export type InspectorProgress = typeof inspectorProgress.$inferSelect;
export type InsertInspectorProgress = z.infer<typeof insertInspectorProgressSchema>;
export type LimitlessTranscript = typeof limitlessTranscripts.$inferSelect;
export type InsertLimitlessTranscript = z.infer<typeof insertLimitlessTranscriptSchema>;
export type ScheduledInspection = typeof scheduledInspections.$inferSelect;
export type InsertScheduledInspection = z.infer<typeof insertScheduledInspectionSchema>;
export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = z.infer<typeof insertTeamAssignmentSchema>;
export type DamageTemplate = typeof damageTemplates.$inferSelect;
export type InsertDamageTemplate = z.infer<typeof insertDamageTemplateSchema>;
