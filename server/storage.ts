import { 
  User, InsertUser, Property, InsertProperty, Scan, InsertScan, Report, InsertReport, 
  CrmConfig, InsertCrmConfig, CrmSyncLog, InsertCrmSyncLog, KnowledgeBase, InsertKnowledgeBase,
  InspectionSession, InsertInspectionSession, EvidenceAsset, InsertEvidenceAsset,
  LimitlessTranscript, InsertLimitlessTranscript, InspectorProgress, InsertInspectorProgress,
  WinnMethodologyStep, WINN_METHODOLOGY_STEPS,
  users, properties, scans, reports, crmConfigs, crmSyncLogs, knowledgeBase,
  inspectionSessions, evidenceAssets, limitlessTranscripts, inspectorProgress
} from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';

// Interface for storage
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  
  // Scan methods
  getScan(id: number): Promise<Scan | undefined>;
  getScansByProperty(propertyId: number): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  
  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getReportsByScan(scanId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // CRM methods
  getCrmConfig(id: number): Promise<CrmConfig | undefined>;
  getCrmConfigsByUser(userId: number): Promise<CrmConfig[]>;
  createCrmConfig(config: InsertCrmConfig & { userId: number }): Promise<CrmConfig>;
  updateCrmConfig(id: number, config: Partial<CrmConfig>): Promise<CrmConfig | undefined>;
  deleteCrmConfig(id: number): Promise<boolean>;
  
  // CRM sync log methods
  getCrmSyncLog(id: number): Promise<CrmSyncLog | undefined>;
  getCrmSyncLogsByConfig(crmConfigId: number): Promise<CrmSyncLog[]>;
  createCrmSyncLog(log: InsertCrmSyncLog): Promise<CrmSyncLog>;
  
  // Knowledge Base methods
  getKnowledgeEntry(id: number): Promise<KnowledgeBase | undefined>;
  getAllKnowledgeEntries(): Promise<KnowledgeBase[]>;
  searchKnowledge(query: string, workflowStep?: string): Promise<KnowledgeBase[]>;
  createKnowledgeEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeEntry(id: number, entry: Partial<KnowledgeBase>): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeEntry(id: number): Promise<boolean>;
  
  // Inspection Session methods (Winn Methodology State Machine)
  getInspectionSession(id: number): Promise<InspectionSession | undefined>;
  getInspectionSessionsByProperty(propertyId: number): Promise<InspectionSession[]>;
  getInspectionSessionsByInspector(inspectorId: number): Promise<InspectionSession[]>;
  getActiveInspectionSession(propertyId: number, inspectorId: number): Promise<InspectionSession | undefined>;
  createInspectionSession(session: InsertInspectionSession): Promise<InspectionSession>;
  updateInspectionSession(id: number, updates: Partial<InspectionSession>): Promise<InspectionSession | undefined>;
  advanceInspectionStep(id: number, nextStep: WinnMethodologyStep): Promise<InspectionSession | undefined>;
  completeInspectionSession(id: number): Promise<InspectionSession | undefined>;
  
  // Evidence Asset methods
  getEvidenceAsset(id: number): Promise<EvidenceAsset | undefined>;
  getEvidenceAssetsBySession(sessionId: number): Promise<EvidenceAsset[]>;
  getEvidenceAssetsByStep(sessionId: number, step: WinnMethodologyStep): Promise<EvidenceAsset[]>;
  createEvidenceAsset(asset: InsertEvidenceAsset): Promise<EvidenceAsset>;
  updateEvidenceAsset(id: number, updates: Partial<EvidenceAsset>): Promise<EvidenceAsset | undefined>;
  deleteEvidenceAsset(id: number): Promise<boolean>;
  
  // Limitless Transcript methods
  getLimitlessTranscript(id: number): Promise<LimitlessTranscript | undefined>;
  getAllLimitlessTranscripts(): Promise<LimitlessTranscript[]>;
  createLimitlessTranscript(transcript: InsertLimitlessTranscript): Promise<LimitlessTranscript>;
  updateLimitlessTranscript(id: number, updates: Partial<LimitlessTranscript>): Promise<LimitlessTranscript | undefined>;
  
  // Inspector Progress methods (Compliance tracking)
  getInspectorProgress(userId: number): Promise<InspectorProgress | undefined>;
  createInspectorProgress(progress: InsertInspectorProgress): Promise<InspectorProgress>;
  updateInspectorProgress(userId: number, updates: Partial<InspectorProgress>): Promise<InspectorProgress | undefined>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user as User || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user as User || undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return updatedUser as User || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    try {
      const [property] = await db.select().from(properties).where(eq(properties.id, id));
      if (!property) return undefined;

      // Get scans for this property
      const propertyScans = await db.select().from(scans).where(eq(scans.propertyId, id));
      
      // Get reports for property scans
      const scanIds = propertyScans.map(s => s.id);
      const propertyReports = scanIds.length > 0 
        ? await db.select().from(reports).where(eq(reports.scanId, scanIds[0])) // Simplified for now
        : [];

      // Return extended property object
      return {
        ...property,
        scans: propertyScans,
        reports: propertyReports,
        healthScore: propertyScans.length > 0 ? propertyScans[0].healthScore || 50 : 50,
        lastScanDate: propertyScans.length > 0 ? propertyScans[0].date : null
      } as any;
    } catch (error) {
      console.error('Error fetching property:', error);
      return undefined;
    }
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    try {
      const userProperties = await db.select().from(properties).where(eq(properties.userId, userId));
      
      // Extend each property with scans and reports
      const extendedProperties = await Promise.all(
        userProperties.map(async (property) => {
          const propertyScans = await db.select().from(scans).where(eq(scans.propertyId, property.id));
          const scanIds = propertyScans.map(s => s.id);
          const propertyReports = scanIds.length > 0 
            ? await db.select().from(reports).where(eq(reports.scanId, scanIds[0]))
            : [];

          return {
            ...property,
            scans: propertyScans,
            reports: propertyReports,
            healthScore: propertyScans.length > 0 ? propertyScans[0].healthScore || 50 : 50,
            lastScanDate: propertyScans.length > 0 ? propertyScans[0].date : null
          } as any;
        })
      );

      return extendedProperties;
    } catch (error) {
      console.error('Error fetching properties by user:', error);
      return [];
    }
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values([property]).returning();
    return {
      ...newProperty,
      scans: [],
      reports: [],
      healthScore: 50,
      lastScanDate: null
    } as any;
  }

  async updateProperty(id: number, updates: Partial<Property>): Promise<Property | undefined> {
    try {
      const [updatedProperty] = await db
        .update(properties)
        .set(updates)
        .where(eq(properties.id, id))
        .returning();
      return updatedProperty as Property || undefined;
    } catch (error) {
      console.error('Error updating property:', error);
      return undefined;
    }
  }

  // Scan methods
  async getScan(id: number): Promise<Scan | undefined> {
    try {
      const [scan] = await db.select().from(scans).where(eq(scans.id, id));
      return scan as Scan || undefined;
    } catch (error) {
      console.error('Error fetching scan:', error);
      return undefined;
    }
  }

  async getScansByProperty(propertyId: number): Promise<Scan[]> {
    try {
      const results = await db.select().from(scans).where(eq(scans.propertyId, propertyId));
      return results as Scan[];
    } catch (error) {
      console.error('Error fetching scans by property:', error);
      return [];
    }
  }

  async createScan(scan: InsertScan): Promise<Scan> {
    const [newScan] = await db.insert(scans).values([scan]).returning();
    return newScan as Scan;
  }

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    try {
      const [report] = await db.select().from(reports).where(eq(reports.id, id));
      return report || undefined;
    } catch (error) {
      console.error('Error fetching report:', error);
      return undefined;
    }
  }

  async getReportsByScan(scanId: number): Promise<Report[]> {
    try {
      return await db.select().from(reports).where(eq(reports.scanId, scanId));
    } catch (error) {
      console.error('Error fetching reports by scan:', error);
      return [];
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  // CRM Configuration methods
  async getCrmConfig(id: number): Promise<CrmConfig | undefined> {
    try {
      const [config] = await db.select().from(crmConfigs).where(eq(crmConfigs.id, id));
      return config || undefined;
    } catch (error) {
      console.error('Error fetching CRM config:', error);
      return undefined;
    }
  }

  async getCrmConfigsByUser(userId: number): Promise<CrmConfig[]> {
    try {
      return await db.select().from(crmConfigs).where(eq(crmConfigs.userId, userId));
    } catch (error) {
      console.error('Error fetching CRM configs by user:', error);
      return [];
    }
  }

  async createCrmConfig(config: InsertCrmConfig & { userId: number }): Promise<CrmConfig> {
    const [newConfig] = await db.insert(crmConfigs).values(config).returning();
    return newConfig;
  }

  async updateCrmConfig(id: number, updates: Partial<CrmConfig>): Promise<CrmConfig | undefined> {
    try {
      const [updatedConfig] = await db
        .update(crmConfigs)
        .set(updates)
        .where(eq(crmConfigs.id, id))
        .returning();
      return updatedConfig || undefined;
    } catch (error) {
      console.error('Error updating CRM config:', error);
      return undefined;
    }
  }

  async deleteCrmConfig(id: number): Promise<boolean> {
    try {
      const result = await db.delete(crmConfigs).where(eq(crmConfigs.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting CRM config:', error);
      return false;
    }
  }

  // CRM Sync Log methods
  async getCrmSyncLog(id: number): Promise<CrmSyncLog | undefined> {
    try {
      const [log] = await db.select().from(crmSyncLogs).where(eq(crmSyncLogs.id, id));
      return log || undefined;
    } catch (error) {
      console.error('Error fetching CRM sync log:', error);
      return undefined;
    }
  }

  async getCrmSyncLogsByConfig(crmConfigId: number): Promise<CrmSyncLog[]> {
    try {
      return await db.select().from(crmSyncLogs).where(eq(crmSyncLogs.crmConfigId, crmConfigId));
    } catch (error) {
      console.error('Error fetching CRM sync logs by config:', error);
      return [];
    }
  }

  async createCrmSyncLog(log: InsertCrmSyncLog): Promise<CrmSyncLog> {
    const [newLog] = await db.insert(crmSyncLogs).values(log).returning();
    return newLog;
  }

  // Knowledge Base methods
  async getKnowledgeEntry(id: number): Promise<KnowledgeBase | undefined> {
    try {
      const [entry] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
      return entry || undefined;
    } catch (error) {
      console.error('Error fetching knowledge entry:', error);
      return undefined;
    }
  }

  async getAllKnowledgeEntries(): Promise<KnowledgeBase[]> {
    try {
      return await db.select().from(knowledgeBase);
    } catch (error) {
      console.error('Error fetching all knowledge entries:', error);
      return [];
    }
  }

  async searchKnowledge(query: string, workflowStep?: string): Promise<KnowledgeBase[]> {
    try {
      const entries = await db.select().from(knowledgeBase);
      
      const lowerQuery = query.toLowerCase();
      return entries.filter(entry => {
        const matchesQuery = 
          entry.title.toLowerCase().includes(lowerQuery) ||
          entry.content.toLowerCase().includes(lowerQuery) ||
          (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
        
        const matchesStep = !workflowStep || entry.workflowStep === workflowStep;
        
        return matchesQuery && matchesStep;
      });
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  async createKnowledgeEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [newEntry] = await db.insert(knowledgeBase).values(entry).returning();
    return newEntry;
  }

  async updateKnowledgeEntry(id: number, updates: Partial<KnowledgeBase>): Promise<KnowledgeBase | undefined> {
    try {
      const [updatedEntry] = await db
        .update(knowledgeBase)
        .set(updates)
        .where(eq(knowledgeBase.id, id))
        .returning();
      return updatedEntry || undefined;
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      return undefined;
    }
  }

  async deleteKnowledgeEntry(id: number): Promise<boolean> {
    try {
      const result = await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      return false;
    }
  }

  // ============================================================================
  // INSPECTION SESSION METHODS - Winn Methodology State Machine
  // ============================================================================

  async getInspectionSession(id: number): Promise<InspectionSession | undefined> {
    try {
      const [session] = await db.select().from(inspectionSessions).where(eq(inspectionSessions.id, id));
      return session || undefined;
    } catch (error) {
      console.error('Error fetching inspection session:', error);
      return undefined;
    }
  }

  async getInspectionSessionsByProperty(propertyId: number): Promise<InspectionSession[]> {
    try {
      return await db.select().from(inspectionSessions).where(eq(inspectionSessions.propertyId, propertyId));
    } catch (error) {
      console.error('Error fetching inspection sessions by property:', error);
      return [];
    }
  }

  async getInspectionSessionsByInspector(inspectorId: number): Promise<InspectionSession[]> {
    try {
      return await db.select().from(inspectionSessions).where(eq(inspectionSessions.inspectorId, inspectorId));
    } catch (error) {
      console.error('Error fetching inspection sessions by inspector:', error);
      return [];
    }
  }

  async getActiveInspectionSession(propertyId: number, inspectorId: number): Promise<InspectionSession | undefined> {
    try {
      const sessions = await db.select().from(inspectionSessions)
        .where(eq(inspectionSessions.propertyId, propertyId));
      
      // Find active session for this inspector
      const activeSession = sessions.find(s => 
        s.inspectorId === inspectorId && 
        (s.status === 'in_progress' || s.status === 'paused')
      );
      
      return activeSession;
    } catch (error) {
      console.error('Error fetching active inspection session:', error);
      return undefined;
    }
  }

  async createInspectionSession(session: InsertInspectionSession): Promise<InspectionSession> {
    const [newSession] = await db.insert(inspectionSessions).values({
      ...session,
      status: session.status || 'in_progress',
      currentStep: session.currentStep || 'weather_verification',
      stepsCompleted: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    }).returning();
    return newSession;
  }

  async updateInspectionSession(id: number, updates: Partial<InspectionSession>): Promise<InspectionSession | undefined> {
    try {
      const [updatedSession] = await db
        .update(inspectionSessions)
        .set({
          ...updates,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(inspectionSessions.id, id))
        .returning();
      return updatedSession || undefined;
    } catch (error) {
      console.error('Error updating inspection session:', error);
      return undefined;
    }
  }

  async advanceInspectionStep(id: number, nextStep: WinnMethodologyStep): Promise<InspectionSession | undefined> {
    try {
      const session = await this.getInspectionSession(id);
      if (!session) return undefined;

      const stepsCompleted = [...(session.stepsCompleted || [])];
      if (session.currentStep && !stepsCompleted.includes(session.currentStep)) {
        stepsCompleted.push(session.currentStep);
      }

      const [updatedSession] = await db
        .update(inspectionSessions)
        .set({
          currentStep: nextStep,
          stepsCompleted,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(inspectionSessions.id, id))
        .returning();
      return updatedSession || undefined;
    } catch (error) {
      console.error('Error advancing inspection step:', error);
      return undefined;
    }
  }

  async completeInspectionSession(id: number): Promise<InspectionSession | undefined> {
    try {
      const session = await this.getInspectionSession(id);
      if (!session) return undefined;

      const stepsCompleted = [...(session.stepsCompleted || [])];
      if (session.currentStep && !stepsCompleted.includes(session.currentStep)) {
        stepsCompleted.push(session.currentStep);
      }

      const [updatedSession] = await db
        .update(inspectionSessions)
        .set({
          status: 'completed',
          stepsCompleted,
          completedAt: new Date(),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(inspectionSessions.id, id))
        .returning();
      return updatedSession || undefined;
    } catch (error) {
      console.error('Error completing inspection session:', error);
      return undefined;
    }
  }

  // ============================================================================
  // EVIDENCE ASSET METHODS - Photos, Thermal Images, Documents
  // ============================================================================

  async getEvidenceAsset(id: number): Promise<EvidenceAsset | undefined> {
    try {
      const [asset] = await db.select().from(evidenceAssets).where(eq(evidenceAssets.id, id));
      return asset || undefined;
    } catch (error) {
      console.error('Error fetching evidence asset:', error);
      return undefined;
    }
  }

  async getEvidenceAssetsBySession(sessionId: number): Promise<EvidenceAsset[]> {
    try {
      return await db.select().from(evidenceAssets).where(eq(evidenceAssets.inspectionSessionId, sessionId));
    } catch (error) {
      console.error('Error fetching evidence assets by session:', error);
      return [];
    }
  }

  async getEvidenceAssetsByStep(sessionId: number, step: WinnMethodologyStep): Promise<EvidenceAsset[]> {
    try {
      const assets = await db.select().from(evidenceAssets)
        .where(eq(evidenceAssets.inspectionSessionId, sessionId));
      return assets.filter(a => a.step === step);
    } catch (error) {
      console.error('Error fetching evidence assets by step:', error);
      return [];
    }
  }

  async createEvidenceAsset(asset: InsertEvidenceAsset): Promise<EvidenceAsset> {
    const [newAsset] = await db.insert(evidenceAssets).values(asset).returning();
    return newAsset;
  }

  async updateEvidenceAsset(id: number, updates: Partial<EvidenceAsset>): Promise<EvidenceAsset | undefined> {
    try {
      const [updatedAsset] = await db
        .update(evidenceAssets)
        .set(updates)
        .where(eq(evidenceAssets.id, id))
        .returning();
      return updatedAsset || undefined;
    } catch (error) {
      console.error('Error updating evidence asset:', error);
      return undefined;
    }
  }

  async deleteEvidenceAsset(id: number): Promise<boolean> {
    try {
      const result = await db.delete(evidenceAssets).where(eq(evidenceAssets.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting evidence asset:', error);
      return false;
    }
  }

  // ============================================================================
  // LIMITLESS TRANSCRIPT METHODS - Eric Winn Recording Ingestion
  // ============================================================================

  async getLimitlessTranscript(id: number): Promise<LimitlessTranscript | undefined> {
    try {
      const [transcript] = await db.select().from(limitlessTranscripts).where(eq(limitlessTranscripts.id, id));
      return transcript || undefined;
    } catch (error) {
      console.error('Error fetching limitless transcript:', error);
      return undefined;
    }
  }

  async getAllLimitlessTranscripts(): Promise<LimitlessTranscript[]> {
    try {
      return await db.select().from(limitlessTranscripts);
    } catch (error) {
      console.error('Error fetching all limitless transcripts:', error);
      return [];
    }
  }

  async createLimitlessTranscript(transcript: InsertLimitlessTranscript): Promise<LimitlessTranscript> {
    const [newTranscript] = await db.insert(limitlessTranscripts).values({
      ...transcript,
      status: 'pending',
    }).returning();
    return newTranscript;
  }

  async updateLimitlessTranscript(id: number, updates: Partial<LimitlessTranscript>): Promise<LimitlessTranscript | undefined> {
    try {
      const [updatedTranscript] = await db
        .update(limitlessTranscripts)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(limitlessTranscripts.id, id))
        .returning();
      return updatedTranscript || undefined;
    } catch (error) {
      console.error('Error updating limitless transcript:', error);
      return undefined;
    }
  }

  // ============================================================================
  // INSPECTOR PROGRESS METHODS - Compliance & Proficiency Tracking
  // ============================================================================

  async getInspectorProgress(userId: number): Promise<InspectorProgress | undefined> {
    try {
      const [progress] = await db.select().from(inspectorProgress).where(eq(inspectorProgress.userId, userId));
      return progress || undefined;
    } catch (error) {
      console.error('Error fetching inspector progress:', error);
      return undefined;
    }
  }

  async createInspectorProgress(progress: InsertInspectorProgress): Promise<InspectorProgress> {
    const [newProgress] = await db.insert(inspectorProgress).values({
      ...progress,
      totalInspections: 0,
      completedInspections: 0,
    }).returning();
    return newProgress;
  }

  async updateInspectorProgress(userId: number, updates: Partial<InspectorProgress>): Promise<InspectorProgress | undefined> {
    try {
      const [updatedProgress] = await db
        .update(inspectorProgress)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(inspectorProgress.userId, userId))
        .returning();
      return updatedProgress || undefined;
    } catch (error) {
      console.error('Error updating inspector progress:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
