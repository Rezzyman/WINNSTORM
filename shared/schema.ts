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
  isAdmin: boolean("is_admin").default(false), // Admin panel access flag
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
  type: text("type").notNull(), // 'jobnimbus', 'aterna', 'salesforce', 'hubspot', 'pipedrive'
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

// AI Conversations - Stormy chat sessions with per-user memory
export interface AIMessageAttachment {
  type: 'image' | 'thermal' | 'document';
  assetId?: number;
  url?: string;
  mimeType?: string;
  filename?: string;
}

export interface AIMemoryPreferences {
  communicationStyle?: 'technical' | 'simplified' | 'detailed';
  focusAreas?: string[];
  propertyProfiles?: Record<string, any>;
  inspectionHistory?: Array<{
    inspectionId: number;
    date: string;
    summary: string;
  }>;
  userPreferences?: Record<string, any>;
}

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title"),
  relatedPropertyId: integer("related_property_id").references(() => properties.id),
  relatedInspectionId: integer("related_inspection_id").references(() => inspectionSessions.id),
  contextType: text("context_type").default('general'),
  status: text("status").notNull().default('active'),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAIConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  messageCount: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => aiConversations.id).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  model: text("model"),
  attachments: jsonb("attachments").$type<AIMessageAttachment[]>(),
  tokenCount: integer("token_count"),
  processingTime: integer("processing_time"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAIMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  tokenCount: true,
  processingTime: true,
  createdAt: true,
});

export const aiMemory = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  scope: text("scope").notNull().default('global'),
  sourceConversationId: integer("source_conversation_id").references(() => aiConversations.id),
  summary: text("summary"),
  keywords: text("keywords").array().default([]),
  preferences: jsonb("preferences").$type<AIMemoryPreferences>(),
  contextSnapshot: text("context_snapshot"),
  tokenEstimate: integer("token_estimate"),
  lastRefreshedAt: timestamp("last_refreshed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAIMemorySchema = createInsertSchema(aiMemory).omit({
  id: true,
  tokenEstimate: true,
  lastRefreshedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type AIConversation = typeof aiConversations.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;
export type AIMessage = typeof aiMessages.$inferSelect;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type AIMemory = typeof aiMemory.$inferSelect;
export type InsertAIMemory = z.infer<typeof insertAIMemorySchema>;

// ============================================================================
// INNOVATION FRAMEWORKS - Enterprise Features for World-Class Platform
// ============================================================================

// -----------------------------------------------------------------------------
// 1. PREDICTIVE CLAIM OUTCOME ENGINE
// AI-powered claim success prediction using historical data and insurer patterns
// -----------------------------------------------------------------------------

export interface ClaimOutcomeFactors {
  evidenceQuality: number;
  documentationCompleteness: number;
  weatherDataMatch: number;
  damageConsistency: number;
  insulorHistoricalRate: number;
  propertyAge: number;
  previousClaimHistory: number;
}

export interface PredictionConfidence {
  overall: number;
  dataQuality: 'high' | 'medium' | 'low';
  factorsConsidered: number;
  similarCasesAnalyzed: number;
}

export const claimOutcomes = pgTable("claim_outcomes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  insurerName: text("insurer_name").notNull(),
  insurerRegion: text("insurer_region"),
  claimType: text("claim_type").notNull(),
  claimAmount: integer("claim_amount"),
  approvedAmount: integer("approved_amount"),
  outcome: text("outcome").notNull(),
  daysToResolution: integer("days_to_resolution"),
  appealAttempts: integer("appeal_attempts").default(0),
  factors: jsonb("factors").$type<ClaimOutcomeFactors>(),
  notes: text("notes"),
  anonymized: boolean("anonymized").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const claimPredictions = pgTable("claim_predictions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  predictedOutcome: text("predicted_outcome").notNull(),
  confidenceScore: doublePrecision("confidence_score").notNull(),
  confidence: jsonb("confidence").$type<PredictionConfidence>(),
  predictedAmount: integer("predicted_amount"),
  predictedDaysToResolution: integer("predicted_days_to_resolution"),
  recommendations: text("recommendations").array().default([]),
  riskFactors: text("risk_factors").array().default([]),
  strengthFactors: text("strength_factors").array().default([]),
  modelVersion: text("model_version"),
  actualOutcome: text("actual_outcome"),
  accuracyScore: doublePrecision("accuracy_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insurerPatterns = pgTable("insurer_patterns", {
  id: serial("id").primaryKey(),
  insurerName: text("insurer_name").notNull().unique(),
  region: text("region"),
  avgApprovalRate: doublePrecision("avg_approval_rate"),
  avgDaysToDecision: doublePrecision("avg_days_to_decision"),
  avgPayoutPercentage: doublePrecision("avg_payout_percentage"),
  preferredEvidenceTypes: text("preferred_evidence_types").array().default([]),
  commonDenialReasons: text("common_denial_reasons").array().default([]),
  appealSuccessRate: doublePrecision("appeal_success_rate"),
  claimVolume: integer("claim_volume").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataQuality: text("data_quality").default('medium'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClaimOutcomeSchema = createInsertSchema(claimOutcomes).omit({
  id: true,
  createdAt: true,
});

export const insertClaimPredictionSchema = createInsertSchema(claimPredictions).omit({
  id: true,
  actualOutcome: true,
  accuracyScore: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInsurerPatternSchema = createInsertSchema(insurerPatterns).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 2. STORMY FIELD CO-PILOT
// Real-time AI guidance during inspections with wearable integration
// -----------------------------------------------------------------------------

export interface FieldSessionContext {
  currentStep: string;
  completedSteps: string[];
  activeGuidance: string;
  environmentalConditions: {
    lighting: string;
    weather: string;
    accessibility: string;
  };
  realTimeAlerts: Array<{
    type: 'warning' | 'info' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export interface WearableDevice {
  deviceId: string;
  deviceType: 'limitless_pendant' | 'smart_glasses' | 'smartwatch' | 'ar_headset';
  capabilities: string[];
  lastSync: string;
  batteryLevel?: number;
}

export const fieldCopilotSessions = pgTable("field_copilot_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  inspectionId: integer("inspection_id").references(() => inspectionSessions.id),
  propertyId: integer("property_id").references(() => properties.id),
  sessionType: text("session_type").notNull(),
  status: text("status").notNull().default('active'),
  context: jsonb("context").$type<FieldSessionContext>(),
  connectedDevices: jsonb("connected_devices").$type<WearableDevice[]>(),
  guidanceMode: text("guidance_mode").default('standard'),
  voiceEnabled: boolean("voice_enabled").default(true),
  handsFreeMode: boolean("hands_free_mode").default(false),
  totalGuidanceEvents: integer("total_guidance_events").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const copilotGuidanceEvents = pgTable("copilot_guidance_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => fieldCopilotSessions.id).notNull(),
  eventType: text("event_type").notNull(),
  triggerSource: text("trigger_source"),
  guidanceContent: text("guidance_content").notNull(),
  visualContext: text("visual_context"),
  userAction: text("user_action"),
  feedbackRating: integer("feedback_rating"),
  responseTimeMs: integer("response_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wearableDevices = pgTable("wearable_devices", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  deviceId: text("device_id").notNull().unique(),
  deviceType: text("device_type").notNull(),
  deviceName: text("device_name"),
  capabilities: text("capabilities").array().default([]),
  firmwareVersion: text("firmware_version"),
  isActive: boolean("is_active").default(true),
  lastConnectedAt: timestamp("last_connected_at"),
  configSettings: jsonb("config_settings").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFieldCopilotSessionSchema = createInsertSchema(fieldCopilotSessions).omit({
  id: true,
  totalGuidanceEvents: true,
  endedAt: true,
  createdAt: true,
});

export const insertCopilotGuidanceEventSchema = createInsertSchema(copilotGuidanceEvents).omit({
  id: true,
  createdAt: true,
});

export const insertWearableDeviceSchema = createInsertSchema(wearableDevices).omit({
  id: true,
  lastConnectedAt: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 3. SMART SENSOR NETWORK (IoT)
// Property monitoring sensors for moisture, impact, and environmental tracking
// -----------------------------------------------------------------------------

export interface SensorReadingData {
  value: number;
  unit: string;
  timestamp: string;
  quality: 'good' | 'degraded' | 'poor';
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'info' | 'warning' | 'critical';
  autoNotify: boolean;
}

export const iotDevices = pgTable("iot_devices", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  deviceSerialNumber: text("device_serial_number").notNull().unique(),
  deviceType: text("device_type").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  firmwareVersion: text("firmware_version"),
  installLocation: text("install_location"),
  installDate: timestamp("install_date"),
  gpsCoordinates: jsonb("gps_coordinates").$type<{ lat: number; lng: number }>(),
  batteryLevel: integer("battery_level"),
  signalStrength: integer("signal_strength"),
  status: text("status").notNull().default('active'),
  lastCommunication: timestamp("last_communication"),
  alertThresholds: jsonb("alert_thresholds").$type<AlertThreshold[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => iotDevices.id).notNull(),
  readingType: text("reading_type").notNull(),
  value: doublePrecision("value").notNull(),
  unit: text("unit").notNull(),
  quality: text("quality").default('good'),
  anomalyDetected: boolean("anomaly_detected").default(false),
  recordedAt: timestamp("recorded_at").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
});

export const sensorAlerts = pgTable("sensor_alerts", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => iotDevices.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  triggerValue: doublePrecision("trigger_value"),
  thresholdValue: doublePrecision("threshold_value"),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  autoCreatedClaim: boolean("auto_created_claim").default(false),
  relatedClaimId: integer("related_claim_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIotDeviceSchema = createInsertSchema(iotDevices).omit({
  id: true,
  lastCommunication: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({
  id: true,
  receivedAt: true,
});

export const insertSensorAlertSchema = createInsertSchema(sensorAlerts).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 4. DRONE INTEGRATION
// Autonomous drone flights with thermal mapping and 3D modeling
// -----------------------------------------------------------------------------

export interface FlightPath {
  waypoints: Array<{ lat: number; lng: number; altitude: number }>;
  totalDistance: number;
  estimatedDuration: number;
}

export interface ThermalMapData {
  heatmapUrl: string;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  hotspots: Array<{ lat: number; lng: number; temp: number; severity: string }>;
}

export interface Model3DData {
  modelUrl: string;
  format: string;
  vertexCount: number;
  textureResolution: string;
  capturePoints: number;
}

export const dronePilots = pgTable("drone_pilots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  faaLicenseNumber: text("faa_license_number"),
  licenseType: text("license_type"),
  licenseExpiry: timestamp("license_expiry"),
  totalFlightHours: doublePrecision("total_flight_hours").default(0),
  certifications: text("certifications").array().default([]),
  insuranceProvider: text("insurance_provider"),
  insuranceExpiry: timestamp("insurance_expiry"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const droneAssets = pgTable("drone_assets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id),
  serialNumber: text("serial_number").notNull().unique(),
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  nickname: text("nickname"),
  droneType: text("drone_type"),
  hasThermallCamera: boolean("has_thermal_camera").default(false),
  thermalCameraModel: text("thermal_camera_model"),
  maxFlightTime: integer("max_flight_time"),
  maxAltitude: integer("max_altitude"),
  firmwareVersion: text("firmware_version"),
  lastMaintenance: timestamp("last_maintenance"),
  status: text("status").notNull().default('available'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flightSessions = pgTable("flight_sessions", {
  id: serial("id").primaryKey(),
  droneId: integer("drone_id").references(() => droneAssets.id).notNull(),
  pilotId: integer("pilot_id").references(() => dronePilots.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  inspectionId: integer("inspection_id").references(() => inspectionSessions.id),
  flightPlan: jsonb("flight_plan").$type<FlightPath>(),
  flightMode: text("flight_mode").notNull(),
  weatherConditions: jsonb("weather_conditions").$type<Record<string, any>>(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  actualDuration: integer("actual_duration"),
  distanceCovered: doublePrecision("distance_covered"),
  maxAltitudeReached: integer("max_altitude_reached"),
  batteryUsed: integer("battery_used"),
  photosCapture: integer("photos_captured").default(0),
  thermalMaps: jsonb("thermal_maps").$type<ThermalMapData[]>(),
  model3D: jsonb("model_3d").$type<Model3DData>(),
  status: text("status").notNull().default('planned'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDronePilotSchema = createInsertSchema(dronePilots).omit({
  id: true,
  totalFlightHours: true,
  createdAt: true,
});

export const insertDroneAssetSchema = createInsertSchema(droneAssets).omit({
  id: true,
  createdAt: true,
});

export const insertFlightSessionSchema = createInsertSchema(flightSessions).omit({
  id: true,
  endTime: true,
  actualDuration: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 5. INSURANCE CARRIER CONSOLE
// White-label portal for insurance companies to receive structured claims
// -----------------------------------------------------------------------------

export interface CarrierBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
}

export interface AdjudicationWorkflow {
  steps: Array<{
    name: string;
    required: boolean;
    assignedRole: string;
    slaHours: number;
  }>;
  autoApprovalThreshold: number;
  escalationRules: Record<string, any>;
}

export const carrierAccounts = pgTable("carrier_accounts", {
  id: serial("id").primaryKey(),
  carrierCode: text("carrier_code").notNull().unique(),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  branding: jsonb("branding").$type<CarrierBranding>(),
  apiKey: text("api_key"),
  webhookUrl: text("webhook_url"),
  adjudicationWorkflow: jsonb("adjudication_workflow").$type<AdjudicationWorkflow>(),
  preferredFormats: text("preferred_formats").array().default([]),
  autoIngestEnabled: boolean("auto_ingest_enabled").default(false),
  subscriptionTier: text("subscription_tier").default('standard'),
  monthlyClaimLimit: integer("monthly_claim_limit"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const carrierUsers = pgTable("carrier_users", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id").references(() => carrierAccounts.id).notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  permissions: text("permissions").array().default([]),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carrierClaimSubmissions = pgTable("carrier_claim_submissions", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id").references(() => carrierAccounts.id).notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  submissionFormat: text("submission_format").notNull(),
  evidencePackageUrl: text("evidence_package_url"),
  structuredData: jsonb("structured_data").$type<Record<string, any>>(),
  aiSummary: text("ai_summary"),
  adjudicationStatus: text("adjudication_status").notNull().default('pending'),
  assignedAdjusterId: integer("assigned_adjuster_id").references(() => carrierUsers.id),
  reviewNotes: text("review_notes"),
  decision: text("decision"),
  decisionReason: text("decision_reason"),
  approvedAmount: integer("approved_amount"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCarrierAccountSchema = createInsertSchema(carrierAccounts).omit({
  id: true,
  apiKey: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCarrierUserSchema = createInsertSchema(carrierUsers).omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
});

export const insertCarrierClaimSubmissionSchema = createInsertSchema(carrierClaimSubmissions).omit({
  id: true,
  submittedAt: true,
  decidedAt: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 6. CONTRACTOR MARKETPLACE
// Matching verified contractors with property owners for repairs
// -----------------------------------------------------------------------------

export interface ContractorCredentials {
  licenses: Array<{ type: string; number: string; state: string; expiry: string }>;
  insurance: Array<{ type: string; provider: string; coverage: number; expiry: string }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
}

export interface ContractorRating {
  overall: number;
  quality: number;
  timeliness: number;
  communication: number;
  value: number;
  reviewCount: number;
}

export const contractorProfiles = pgTable("contractor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  serviceAreas: text("service_areas").array().default([]),
  specialties: text("specialties").array().default([]),
  credentials: jsonb("credentials").$type<ContractorCredentials>(),
  rating: jsonb("rating").$type<ContractorRating>(),
  yearsInBusiness: integer("years_in_business"),
  employeeCount: integer("employee_count"),
  portfolioUrls: text("portfolio_urls").array().default([]),
  description: text("description"),
  responseTimeHours: integer("response_time_hours"),
  verificationStatus: text("verification_status").notNull().default('pending'),
  verifiedAt: timestamp("verified_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const repairJobs = pgTable("repair_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  propertyId: integer("property_id").references(() => properties.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  jobType: text("job_type").notNull(),
  urgency: text("urgency").notNull().default('standard'),
  estimatedBudget: integer("estimated_budget"),
  requiredSpecialties: text("required_specialties").array().default([]),
  preferredStartDate: timestamp("preferred_start_date"),
  status: text("status").notNull().default('open'),
  selectedContractorId: integer("selected_contractor_id").references(() => contractorProfiles.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractorBids = pgTable("contractor_bids", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => repairJobs.id).notNull(),
  contractorId: integer("contractor_id").references(() => contractorProfiles.id).notNull(),
  bidAmount: integer("bid_amount").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  proposalText: text("proposal_text"),
  includedServices: text("included_services").array().default([]),
  warranty: text("warranty"),
  status: text("status").notNull().default('submitted'),
  isWinningBid: boolean("is_winning_bid").default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralFees = pgTable("referral_fees", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => repairJobs.id).notNull(),
  contractorId: integer("contractor_id").references(() => contractorProfiles.id).notNull(),
  referringConsultantId: integer("referring_consultant_id").references(() => users.id),
  feePercentage: doublePrecision("fee_percentage").notNull(),
  feeAmount: integer("fee_amount"),
  jobValue: integer("job_value").notNull(),
  status: text("status").notNull().default('pending'),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContractorProfileSchema = createInsertSchema(contractorProfiles).omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepairJobSchema = createInsertSchema(repairJobs).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractorBidSchema = createInsertSchema(contractorBids).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
});

export const insertReferralFeeSchema = createInsertSchema(referralFees).omit({
  id: true,
  paidAt: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 7. REGIONAL RISK INTELLIGENCE
// Anonymized data product for insurers and reinsurers
// -----------------------------------------------------------------------------

export interface GeographicRiskMetrics {
  hailFrequency: number;
  windDamageFrequency: number;
  floodRisk: number;
  avgClaimSeverity: number;
  avgPropertyAge: number;
  predominantRoofTypes: Record<string, number>;
}

export interface RiskTrend {
  period: string;
  claimCount: number;
  avgSeverity: number;
  totalPayout: number;
  primaryDamageTypes: string[];
}

export const riskRegions = pgTable("risk_regions", {
  id: serial("id").primaryKey(),
  regionCode: text("region_code").notNull().unique(),
  regionName: text("region_name").notNull(),
  regionType: text("region_type").notNull(),
  state: text("state"),
  boundaryGeoJson: jsonb("boundary_geo_json").$type<Record<string, any>>(),
  centerPoint: jsonb("center_point").$type<{ lat: number; lng: number }>(),
  propertyCount: integer("property_count").default(0),
  dataQuality: text("data_quality").default('medium'),
  lastCalculated: timestamp("last_calculated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  regionId: integer("region_id").references(() => riskRegions.id).notNull(),
  assessmentPeriod: text("assessment_period").notNull(),
  metrics: jsonb("metrics").$type<GeographicRiskMetrics>(),
  riskScore: doublePrecision("risk_score").notNull(),
  riskCategory: text("risk_category").notNull(),
  trends: jsonb("trends").$type<RiskTrend[]>(),
  comparisonToState: doublePrecision("comparison_to_state"),
  comparisonToNational: doublePrecision("comparison_to_national"),
  confidenceLevel: doublePrecision("confidence_level"),
  sampleSize: integer("sample_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const riskDataExports = pgTable("risk_data_exports", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id").references(() => carrierAccounts.id),
  exportType: text("export_type").notNull(),
  regionsIncluded: text("regions_included").array().default([]),
  dateRange: jsonb("date_range").$type<{ start: string; end: string }>(),
  format: text("format").notNull(),
  fileUrl: text("file_url"),
  recordCount: integer("record_count"),
  pricePaid: integer("price_paid"),
  status: text("status").notNull().default('pending'),
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRiskRegionSchema = createInsertSchema(riskRegions).omit({
  id: true,
  lastCalculated: true,
  createdAt: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertRiskDataExportSchema = createInsertSchema(riskDataExports).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
});

// -----------------------------------------------------------------------------
// 8. INNOVATION MODULE REGISTRY
// Tracks enabled/disabled features per organization
// -----------------------------------------------------------------------------

export interface ModuleConfig {
  settings: Record<string, any>;
  limits: Record<string, number>;
  integrations: string[];
}

export const innovationModules = pgTable("innovation_modules", {
  id: serial("id").primaryKey(),
  moduleCode: text("module_code").notNull().unique(),
  moduleName: text("module_name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  version: text("version").notNull().default('1.0.0'),
  status: text("status").notNull().default('preview'),
  requiredSubscription: text("required_subscription"),
  defaultConfig: jsonb("default_config").$type<ModuleConfig>(),
  dependencies: text("dependencies").array().default([]),
  isActive: boolean("is_active").default(false),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationModules = pgTable("organization_modules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id"),
  moduleId: integer("module_id").references(() => innovationModules.id).notNull(),
  enabled: boolean("enabled").default(false),
  config: jsonb("config").$type<ModuleConfig>(),
  enabledBy: text("enabled_by"),
  enabledAt: timestamp("enabled_at"),
  usageStats: jsonb("usage_stats").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInnovationModuleSchema = createInsertSchema(innovationModules).omit({
  id: true,
  releasedAt: true,
  createdAt: true,
});

export const insertOrganizationModuleSchema = createInsertSchema(organizationModules).omit({
  id: true,
  enabledAt: true,
  createdAt: true,
  updatedAt: true,
});

// -----------------------------------------------------------------------------
// TYPE EXPORTS FOR ALL INNOVATION FRAMEWORKS
// -----------------------------------------------------------------------------

export type ClaimOutcome = typeof claimOutcomes.$inferSelect;
export type InsertClaimOutcome = z.infer<typeof insertClaimOutcomeSchema>;
export type ClaimPrediction = typeof claimPredictions.$inferSelect;
export type InsertClaimPrediction = z.infer<typeof insertClaimPredictionSchema>;
export type InsurerPattern = typeof insurerPatterns.$inferSelect;
export type InsertInsurerPattern = z.infer<typeof insertInsurerPatternSchema>;

export type FieldCopilotSession = typeof fieldCopilotSessions.$inferSelect;
export type InsertFieldCopilotSession = z.infer<typeof insertFieldCopilotSessionSchema>;
export type CopilotGuidanceEvent = typeof copilotGuidanceEvents.$inferSelect;
export type InsertCopilotGuidanceEvent = z.infer<typeof insertCopilotGuidanceEventSchema>;
export type WearableDeviceRecord = typeof wearableDevices.$inferSelect;
export type InsertWearableDeviceRecord = z.infer<typeof insertWearableDeviceSchema>;

export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type SensorAlert = typeof sensorAlerts.$inferSelect;
export type InsertSensorAlert = z.infer<typeof insertSensorAlertSchema>;

export type DronePilot = typeof dronePilots.$inferSelect;
export type InsertDronePilot = z.infer<typeof insertDronePilotSchema>;
export type DroneAsset = typeof droneAssets.$inferSelect;
export type InsertDroneAsset = z.infer<typeof insertDroneAssetSchema>;
export type FlightSession = typeof flightSessions.$inferSelect;
export type InsertFlightSession = z.infer<typeof insertFlightSessionSchema>;

export type CarrierAccount = typeof carrierAccounts.$inferSelect;
export type InsertCarrierAccount = z.infer<typeof insertCarrierAccountSchema>;
export type CarrierUser = typeof carrierUsers.$inferSelect;
export type InsertCarrierUser = z.infer<typeof insertCarrierUserSchema>;
export type CarrierClaimSubmission = typeof carrierClaimSubmissions.$inferSelect;
export type InsertCarrierClaimSubmission = z.infer<typeof insertCarrierClaimSubmissionSchema>;

export type ContractorProfile = typeof contractorProfiles.$inferSelect;
export type InsertContractorProfile = z.infer<typeof insertContractorProfileSchema>;
export type RepairJob = typeof repairJobs.$inferSelect;
export type InsertRepairJob = z.infer<typeof insertRepairJobSchema>;
export type ContractorBid = typeof contractorBids.$inferSelect;
export type InsertContractorBid = z.infer<typeof insertContractorBidSchema>;
export type ReferralFee = typeof referralFees.$inferSelect;
export type InsertReferralFee = z.infer<typeof insertReferralFeeSchema>;

export type RiskRegion = typeof riskRegions.$inferSelect;
export type InsertRiskRegion = z.infer<typeof insertRiskRegionSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskDataExport = typeof riskDataExports.$inferSelect;
export type InsertRiskDataExport = z.infer<typeof insertRiskDataExportSchema>;

export type InnovationModule = typeof innovationModules.$inferSelect;
export type InsertInnovationModule = z.infer<typeof insertInnovationModuleSchema>;
export type OrganizationModule = typeof organizationModules.$inferSelect;
export type InsertOrganizationModule = z.infer<typeof insertOrganizationModuleSchema>;

// -----------------------------------------------------------------------------
// 9. STORMY KNOWLEDGE BASE
// Secure document storage for AI training and contextual responses
// -----------------------------------------------------------------------------

export interface DocumentMetadata {
  author?: string;
  source?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  extractedTopics?: string[];
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  // Multimedia metadata
  duration?: number; // For audio/video in seconds
  resolution?: string; // For video/images (e.g., "1920x1080")
  thumbnailUrl?: string; // Generated thumbnail for video/images
  transcription?: string; // Transcribed text from audio/video
  transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  // Manufacturer/product metadata
  manufacturer?: string;
  productModel?: string;
  partNumber?: string;
  specifications?: Record<string, string>;
  // Reference metadata
  tags?: string[];
  relatedDocumentIds?: number[];
  externalUrl?: string;
  // Embedding metadata
  embeddingsGenerated?: boolean;
  embeddingCount?: number;
}

export interface EmbeddingChunk {
  chunkIndex: number;
  content: string;
  embedding?: number[];
  tokenCount?: number;
}

export const knowledgeCategories = pgTable("knowledge_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => knowledgeCategories.id),
  documentType: text("document_type").notNull(), // 'transcript', 'manual', 'guide', 'faq', 'methodology', 'case_study'
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  content: text("content"), // Extracted text content for searchability
  summary: text("summary"), // AI-generated summary
  metadata: jsonb("metadata").$type<DocumentMetadata>(),
  isPublic: boolean("is_public").default(false), // Whether available to all users or just admins
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => knowledgeDocuments.id).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  chunkContent: text("chunk_content").notNull(),
  embedding: jsonb("embedding").$type<number[]>(), // Vector embedding for semantic search
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const knowledgeAuditLog = pgTable("knowledge_audit_log", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => knowledgeDocuments.id),
  categoryId: integer("category_id").references(() => knowledgeCategories.id),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'approve', 'upload', 'download'
  userId: integer("user_id").references(() => users.id).notNull(),
  userEmail: text("user_email"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKnowledgeCategorySchema = createInsertSchema(knowledgeCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({
  id: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeEmbeddingSchema = createInsertSchema(knowledgeEmbeddings).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeAuditLogSchema = createInsertSchema(knowledgeAuditLog).omit({
  id: true,
  createdAt: true,
});

export type KnowledgeCategory = typeof knowledgeCategories.$inferSelect;
export type InsertKnowledgeCategory = z.infer<typeof insertKnowledgeCategorySchema>;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type KnowledgeEmbedding = typeof knowledgeEmbeddings.$inferSelect;
export type InsertKnowledgeEmbedding = z.infer<typeof insertKnowledgeEmbeddingSchema>;
export type KnowledgeAuditLog = typeof knowledgeAuditLog.$inferSelect;
export type InsertKnowledgeAuditLog = z.infer<typeof insertKnowledgeAuditLogSchema>;

// Admin Credentials - Separate password-based auth for admin panel
export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminCredentialsSchema = createInsertSchema(adminCredentials).omit({
  id: true,
  lastLogin: true,
  loginAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminCredentials = typeof adminCredentials.$inferSelect;
export type InsertAdminCredentials = z.infer<typeof insertAdminCredentialsSchema>;

// Team Member Credentials - Separate password-based auth for knowledge upload portal
export const teamCredentials = pgTable("team_credentials", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdBy: text("created_by"), // Admin email who created this team member
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamCredentialsSchema = createInsertSchema(teamCredentials).omit({
  id: true,
  lastLogin: true,
  loginAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamCredentials = typeof teamCredentials.$inferSelect;
export type InsertTeamCredentials = z.infer<typeof insertTeamCredentialsSchema>;

// System Settings - Store configurable settings like Stormy AI prompt
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
