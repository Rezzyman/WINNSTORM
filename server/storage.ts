import {
  User, InsertUser, Property, InsertProperty, Scan, InsertScan, Report, InsertReport,
  CrmConfig, InsertCrmConfig, CrmSyncLog, InsertCrmSyncLog, KnowledgeBase, InsertKnowledgeBase,
  InspectionSession, InsertInspectionSession, EvidenceAsset, InsertEvidenceAsset,
  LimitlessTranscript, InsertLimitlessTranscript, InspectorProgress, InsertInspectorProgress,
  Project, InsertProject, ScheduledInspection, InsertScheduledInspection,
  TeamAssignment, InsertTeamAssignment, DamageTemplate, InsertDamageTemplate,
  AIConversation, InsertAIConversation, AIMessage, InsertAIMessage, AIMemory, InsertAIMemory,
  WinnMethodologyStep, WINN_METHODOLOGY_STEPS,
  KnowledgeCategory, InsertKnowledgeCategory, KnowledgeDocument, InsertKnowledgeDocument,
  KnowledgeEmbedding, InsertKnowledgeEmbedding, KnowledgeAuditLog, InsertKnowledgeAuditLog,
  AdminCredentials, InsertAdminCredentials,
  TeamCredentials, InsertTeamCredentials,
  SystemSettings, InsertSystemSettings,
  users, properties, scans, reports, crmConfigs, crmSyncLogs, knowledgeBase,
  inspectionSessions, evidenceAssets, limitlessTranscripts, inspectorProgress, projects, clients,
  scheduledInspections, teamAssignments, damageTemplates, aiConversations, aiMessages, aiMemory,
  knowledgeCategories, knowledgeDocuments, knowledgeEmbeddings, knowledgeAuditLog, adminCredentials, teamCredentials,
  systemSettings
} from "@shared/schema";
import { db } from './db';
import { eq, or, inArray, and, desc, ilike, isNotNull } from 'drizzle-orm';

// Interface for storage
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByConsultant(consultantId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  
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
  
  // Scheduled Inspection methods
  getScheduledInspection(id: number): Promise<ScheduledInspection | undefined>;
  getScheduledInspectionsByInspector(inspectorId: number, startDate?: Date, endDate?: Date): Promise<ScheduledInspection[]>;
  getScheduledInspectionsByDate(date: Date, inspectorId?: number): Promise<ScheduledInspection[]>;
  createScheduledInspection(inspection: InsertScheduledInspection): Promise<ScheduledInspection>;
  updateScheduledInspection(id: number, updates: Partial<ScheduledInspection>): Promise<ScheduledInspection | undefined>;
  cancelScheduledInspection(id: number, reason: string): Promise<ScheduledInspection | undefined>;
  
  // Team Assignment methods
  getTeamAssignment(inspectorId: number): Promise<TeamAssignment | undefined>;
  getAllTeamAssignments(): Promise<TeamAssignment[]>;
  createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment>;
  updateTeamAssignment(id: number, updates: Partial<TeamAssignment>): Promise<TeamAssignment | undefined>;
  deleteTeamAssignment(id: number): Promise<boolean>;
  
  // Damage Template methods
  getDamageTemplate(id: number): Promise<DamageTemplate | undefined>;
  getAllDamageTemplates(): Promise<DamageTemplate[]>;
  getDamageTemplatesByCategory(category: string): Promise<DamageTemplate[]>;
  createDamageTemplate(template: InsertDamageTemplate): Promise<DamageTemplate>;
  updateDamageTemplate(id: number, updates: Partial<DamageTemplate>): Promise<DamageTemplate | undefined>;
  deleteDamageTemplate(id: number): Promise<boolean>;
  
  // AI Conversation methods (Stormy)
  getAIConversation(id: number): Promise<AIConversation | undefined>;
  getAIConversationsByUser(userId: string): Promise<AIConversation[]>;
  createAIConversation(conversation: InsertAIConversation): Promise<AIConversation>;
  updateAIConversation(id: number, updates: Partial<AIConversation>): Promise<AIConversation | undefined>;
  
  // AI Message methods
  getAIMessage(id: number): Promise<AIMessage | undefined>;
  getAIMessagesByConversation(conversationId: number): Promise<AIMessage[]>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  
  // AI Memory methods
  getAIMemory(id: number): Promise<AIMemory | undefined>;
  getAIMemoryByUser(userId: string): Promise<AIMemory[]>;
  createAIMemory(memory: InsertAIMemory): Promise<AIMemory>;
  updateAIMemory(id: number, updates: Partial<AIMemory>): Promise<AIMemory>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAllProjects(): Promise<Project[]>;
  getAllProperties(): Promise<Property[]>;
  getAllClients(): Promise<any[]>;
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

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project as Project || undefined;
    } catch (error) {
      console.error('Error fetching project:', error);
      return undefined;
    }
  }

  async getProjectsByConsultant(consultantId: number): Promise<Project[]> {
    try {
      // Get projects assigned directly to consultant OR projects whose clients belong to consultant
      const consultantClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, consultantId));
      const clientIds = consultantClients.map(c => c.id);
      
      let result: Project[] = [];
      
      if (clientIds.length > 0) {
        // Get projects for consultant's clients
        const clientProjects = await db.select().from(projects).where(inArray(projects.clientId, clientIds));
        result = clientProjects as Project[];
      }
      
      // Also get directly assigned projects (if assignedConsultantId is set)
      const assignedProjects = await db.select().from(projects).where(eq(projects.assignedConsultantId, consultantId));
      
      // Merge and dedupe
      const existingIds = new Set(result.map(p => p.id));
      for (const project of assignedProjects) {
        if (!existingIds.has(project.id)) {
          result.push(project as Project);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching projects by consultant:', error);
      return [];
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject as Project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    try {
      const [updatedProject] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
      return updatedProject as Project || undefined;
    } catch (error) {
      console.error('Error updating project:', error);
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

  // ============================================================================
  // SCHEDULED INSPECTION METHODS - Multi-property scheduling
  // ============================================================================

  async getScheduledInspection(id: number): Promise<ScheduledInspection | undefined> {
    try {
      const [inspection] = await db.select().from(scheduledInspections).where(eq(scheduledInspections.id, id));
      return inspection || undefined;
    } catch (error) {
      console.error('Error fetching scheduled inspection:', error);
      return undefined;
    }
  }

  async getScheduledInspectionsByInspector(
    inspectorId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<ScheduledInspection[]> {
    try {
      let query = db.select().from(scheduledInspections).where(eq(scheduledInspections.inspectorId, inspectorId));
      const results = await query;
      
      if (startDate || endDate) {
        return results.filter(i => {
          const date = new Date(i.scheduledDate);
          if (startDate && date < startDate) return false;
          if (endDate && date > endDate) return false;
          return true;
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching scheduled inspections by inspector:', error);
      return [];
    }
  }

  async getScheduledInspectionsByDate(date: Date, inspectorId?: number): Promise<ScheduledInspection[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let results = await db.select().from(scheduledInspections);
      
      return results.filter(i => {
        const inspectionDate = new Date(i.scheduledDate);
        const matchesDate = inspectionDate >= startOfDay && inspectionDate <= endOfDay;
        const matchesInspector = inspectorId ? i.inspectorId === inspectorId : true;
        return matchesDate && matchesInspector;
      });
    } catch (error) {
      console.error('Error fetching scheduled inspections by date:', error);
      return [];
    }
  }

  async createScheduledInspection(inspection: InsertScheduledInspection): Promise<ScheduledInspection> {
    const [newInspection] = await db.insert(scheduledInspections).values(inspection).returning();
    return newInspection;
  }

  async updateScheduledInspection(id: number, updates: Partial<ScheduledInspection>): Promise<ScheduledInspection | undefined> {
    try {
      const [updatedInspection] = await db
        .update(scheduledInspections)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(scheduledInspections.id, id))
        .returning();
      return updatedInspection || undefined;
    } catch (error) {
      console.error('Error updating scheduled inspection:', error);
      return undefined;
    }
  }

  async cancelScheduledInspection(id: number, reason: string): Promise<ScheduledInspection | undefined> {
    try {
      const [cancelled] = await db
        .update(scheduledInspections)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(scheduledInspections.id, id))
        .returning();
      return cancelled || undefined;
    } catch (error) {
      console.error('Error cancelling scheduled inspection:', error);
      return undefined;
    }
  }

  // Team Assignment methods
  async getTeamAssignment(inspectorId: number): Promise<TeamAssignment | undefined> {
    try {
      const [assignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.inspectorId, inspectorId));
      return assignment || undefined;
    } catch (error) {
      console.error('Error fetching team assignment:', error);
      return undefined;
    }
  }

  async getAllTeamAssignments(): Promise<TeamAssignment[]> {
    try {
      return await db.select().from(teamAssignments);
    } catch (error) {
      console.error('Error fetching all team assignments:', error);
      return [];
    }
  }

  async createTeamAssignment(assignment: InsertTeamAssignment): Promise<TeamAssignment> {
    const [newAssignment] = await db.insert(teamAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateTeamAssignment(id: number, updates: Partial<TeamAssignment>): Promise<TeamAssignment | undefined> {
    try {
      const [updated] = await db
        .update(teamAssignments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(teamAssignments.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating team assignment:', error);
      return undefined;
    }
  }

  async deleteTeamAssignment(id: number): Promise<boolean> {
    try {
      await db.delete(teamAssignments).where(eq(teamAssignments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting team assignment:', error);
      return false;
    }
  }

  // Damage Template methods
  async getDamageTemplate(id: number): Promise<DamageTemplate | undefined> {
    try {
      const [template] = await db.select().from(damageTemplates).where(eq(damageTemplates.id, id));
      return template || undefined;
    } catch (error) {
      console.error('Error fetching damage template:', error);
      return undefined;
    }
  }

  async getAllDamageTemplates(): Promise<DamageTemplate[]> {
    try {
      return await db.select().from(damageTemplates).orderBy(damageTemplates.sortOrder);
    } catch (error) {
      console.error('Error fetching all damage templates:', error);
      return [];
    }
  }

  async getDamageTemplatesByCategory(category: string): Promise<DamageTemplate[]> {
    try {
      return await db.select().from(damageTemplates).where(eq(damageTemplates.category, category));
    } catch (error) {
      console.error('Error fetching damage templates by category:', error);
      return [];
    }
  }

  async createDamageTemplate(template: InsertDamageTemplate): Promise<DamageTemplate> {
    const [newTemplate] = await db.insert(damageTemplates).values(template).returning();
    return newTemplate;
  }

  async updateDamageTemplate(id: number, updates: Partial<DamageTemplate>): Promise<DamageTemplate | undefined> {
    try {
      const [updated] = await db
        .update(damageTemplates)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(damageTemplates.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating damage template:', error);
      return undefined;
    }
  }

  async deleteDamageTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(damageTemplates).where(eq(damageTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting damage template:', error);
      return false;
    }
  }

  // AI Conversation methods (Stormy)
  async getAIConversation(id: number): Promise<AIConversation | undefined> {
    try {
      const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
      return conversation || undefined;
    } catch (error) {
      console.error('Error fetching AI conversation:', error);
      return undefined;
    }
  }

  async getAIConversationsByUser(userId: string): Promise<AIConversation[]> {
    try {
      return await db.select().from(aiConversations).where(eq(aiConversations.userId, userId));
    } catch (error) {
      console.error('Error fetching AI conversations by user:', error);
      return [];
    }
  }

  async createAIConversation(conversation: InsertAIConversation): Promise<AIConversation> {
    const [newConversation] = await db.insert(aiConversations).values(conversation).returning();
    return newConversation;
  }

  async updateAIConversation(id: number, updates: Partial<AIConversation>): Promise<AIConversation | undefined> {
    try {
      const [updated] = await db
        .update(aiConversations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(aiConversations.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating AI conversation:', error);
      return undefined;
    }
  }

  // AI Message methods
  async getAIMessage(id: number): Promise<AIMessage | undefined> {
    try {
      const [message] = await db.select().from(aiMessages).where(eq(aiMessages.id, id));
      return message || undefined;
    } catch (error) {
      console.error('Error fetching AI message:', error);
      return undefined;
    }
  }

  async getAIMessagesByConversation(conversationId: number): Promise<AIMessage[]> {
    try {
      return await db.select().from(aiMessages).where(eq(aiMessages.conversationId, conversationId));
    } catch (error) {
      console.error('Error fetching AI messages by conversation:', error);
      return [];
    }
  }

  async createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
    const [newMessage] = await db.insert(aiMessages).values(message).returning();
    return newMessage;
  }

  // AI Memory methods
  async getAIMemory(id: number): Promise<AIMemory | undefined> {
    try {
      const [memory] = await db.select().from(aiMemory).where(eq(aiMemory.id, id));
      return memory || undefined;
    } catch (error) {
      console.error('Error fetching AI memory:', error);
      return undefined;
    }
  }

  async getAIMemoryByUser(userId: string): Promise<AIMemory[]> {
    try {
      return await db.select().from(aiMemory).where(eq(aiMemory.userId, userId));
    } catch (error) {
      console.error('Error fetching AI memory by user:', error);
      return [];
    }
  }

  async createAIMemory(memory: InsertAIMemory): Promise<AIMemory> {
    const [newMemory] = await db.insert(aiMemory).values(memory).returning();
    return newMemory;
  }

  async updateAIMemory(id: number, updates: Partial<AIMemory>): Promise<AIMemory> {
    const [updated] = await db
      .update(aiMemory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiMemory.id, id))
      .returning();
    return updated;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result as User[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const result = await db.select().from(projects);
      return result as Project[];
    } catch (error) {
      console.error('Error fetching all projects:', error);
      return [];
    }
  }

  async getAllProperties(): Promise<Property[]> {
    try {
      const result = await db.select().from(properties);
      return result as Property[];
    } catch (error) {
      console.error('Error fetching all properties:', error);
      return [];
    }
  }

  async getAllClients(): Promise<any[]> {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error('Error fetching all clients:', error);
      return [];
    }
  }

  // =============================================================================
  // KNOWLEDGE BASE METHODS
  // =============================================================================

  // Knowledge Categories
  async getAllKnowledgeCategories(): Promise<KnowledgeCategory[]> {
    try {
      const result = await db.select().from(knowledgeCategories).orderBy(knowledgeCategories.orderIndex);
      return result;
    } catch (error) {
      console.error('Error fetching knowledge categories:', error);
      return [];
    }
  }

  async getKnowledgeCategoryById(id: number): Promise<KnowledgeCategory | undefined> {
    try {
      const [category] = await db.select().from(knowledgeCategories).where(eq(knowledgeCategories.id, id));
      return category || undefined;
    } catch (error) {
      console.error('Error fetching knowledge category:', error);
      return undefined;
    }
  }

  async getKnowledgeCategoryByName(name: string): Promise<KnowledgeCategory | undefined> {
    try {
      const [category] = await db.select().from(knowledgeCategories).where(eq(knowledgeCategories.name, name));
      return category || undefined;
    } catch (error) {
      console.error('Error fetching knowledge category by name:', error);
      return undefined;
    }
  }

  async createKnowledgeCategory(data: InsertKnowledgeCategory): Promise<KnowledgeCategory> {
    const [category] = await db.insert(knowledgeCategories).values(data).returning();
    return category;
  }

  async updateKnowledgeCategory(id: number, updates: Partial<KnowledgeCategory>): Promise<KnowledgeCategory | undefined> {
    try {
      const [updated] = await db
        .update(knowledgeCategories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(knowledgeCategories.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating knowledge category:', error);
      return undefined;
    }
  }

  async deleteKnowledgeCategory(id: number): Promise<boolean> {
    try {
      await db.delete(knowledgeCategories).where(eq(knowledgeCategories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting knowledge category:', error);
      return false;
    }
  }

  // Knowledge Documents
  async getAllKnowledgeDocuments(filters: { categoryId?: number; documentType?: string }): Promise<KnowledgeDocument[]> {
    try {
      let query = db.select().from(knowledgeDocuments);
      
      const conditions = [];
      if (filters.categoryId) {
        conditions.push(eq(knowledgeDocuments.categoryId, filters.categoryId));
      }
      if (filters.documentType) {
        conditions.push(eq(knowledgeDocuments.documentType, filters.documentType));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const result = await query.orderBy(desc(knowledgeDocuments.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching knowledge documents:', error);
      return [];
    }
  }

  async getKnowledgeDocumentById(id: number): Promise<KnowledgeDocument | undefined> {
    try {
      const [document] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
      return document || undefined;
    } catch (error) {
      console.error('Error fetching knowledge document:', error);
      return undefined;
    }
  }

  async createKnowledgeDocument(data: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
    const [document] = await db.insert(knowledgeDocuments).values(data).returning();
    return document;
  }

  async updateKnowledgeDocument(id: number, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | undefined> {
    try {
      const [updated] = await db
        .update(knowledgeDocuments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(knowledgeDocuments.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating knowledge document:', error);
      return undefined;
    }
  }

  async approveKnowledgeDocument(id: number, approvedBy: number): Promise<KnowledgeDocument | undefined> {
    try {
      const [updated] = await db
        .update(knowledgeDocuments)
        .set({ 
          approvedBy, 
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(knowledgeDocuments.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error approving knowledge document:', error);
      return undefined;
    }
  }

  async deleteKnowledgeDocument(id: number): Promise<boolean> {
    try {
      // First delete related embeddings
      await db.delete(knowledgeEmbeddings).where(eq(knowledgeEmbeddings.documentId, id));
      // Then delete the document
      await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting knowledge document:', error);
      return false;
    }
  }

  async searchKnowledgeDocuments(query: string): Promise<KnowledgeDocument[]> {
    try {
      const results = await db
        .select()
        .from(knowledgeDocuments)
        .where(
          or(
            ilike(knowledgeDocuments.title, `%${query}%`),
            ilike(knowledgeDocuments.content, `%${query}%`),
            ilike(knowledgeDocuments.description, `%${query}%`)
          )
        )
        .orderBy(desc(knowledgeDocuments.createdAt));
      return results;
    } catch (error) {
      console.error('Error searching knowledge documents:', error);
      return [];
    }
  }

  // Knowledge Embeddings
  async createKnowledgeEmbedding(data: InsertKnowledgeEmbedding): Promise<KnowledgeEmbedding> {
    const [embedding] = await db.insert(knowledgeEmbeddings).values(data).returning();
    return embedding;
  }

  async getKnowledgeEmbeddingsByDocument(documentId: number): Promise<KnowledgeEmbedding[]> {
    try {
      const results = await db
        .select()
        .from(knowledgeEmbeddings)
        .where(eq(knowledgeEmbeddings.documentId, documentId))
        .orderBy(knowledgeEmbeddings.chunkIndex);
      return results;
    } catch (error) {
      console.error('Error fetching knowledge embeddings:', error);
      return [];
    }
  }

  async deleteKnowledgeEmbeddingsByDocument(documentId: number): Promise<boolean> {
    try {
      await db.delete(knowledgeEmbeddings).where(eq(knowledgeEmbeddings.documentId, documentId));
      return true;
    } catch (error) {
      console.error('Error deleting knowledge embeddings:', error);
      return false;
    }
  }

  async getAllKnowledgeEmbeddingsWithDocs(): Promise<Array<KnowledgeEmbedding & { document: KnowledgeDocument }>> {
    try {
      const results = await db
        .select({
          id: knowledgeEmbeddings.id,
          documentId: knowledgeEmbeddings.documentId,
          chunkIndex: knowledgeEmbeddings.chunkIndex,
          chunkContent: knowledgeEmbeddings.chunkContent,
          embedding: knowledgeEmbeddings.embedding,
          tokenCount: knowledgeEmbeddings.tokenCount,
          createdAt: knowledgeEmbeddings.createdAt,
          document: knowledgeDocuments,
        })
        .from(knowledgeEmbeddings)
        .innerJoin(knowledgeDocuments, eq(knowledgeEmbeddings.documentId, knowledgeDocuments.id))
        .where(
          and(
            eq(knowledgeDocuments.isActive, true),
            isNotNull(knowledgeDocuments.approvedAt)
          )
        );
      return results as any;
    } catch (error) {
      console.error('Error fetching all knowledge embeddings:', error);
      return [];
    }
  }

  // Knowledge Audit Log
  async createKnowledgeAuditLog(data: InsertKnowledgeAuditLog): Promise<KnowledgeAuditLog> {
    const [log] = await db.insert(knowledgeAuditLog).values(data).returning();
    return log;
  }

  async getKnowledgeAuditLogs(limit: number = 100, offset: number = 0): Promise<KnowledgeAuditLog[]> {
    try {
      const results = await db
        .select()
        .from(knowledgeAuditLog)
        .orderBy(desc(knowledgeAuditLog.createdAt))
        .limit(limit)
        .offset(offset);
      return results;
    } catch (error) {
      console.error('Error fetching knowledge audit logs:', error);
      return [];
    }
  }

  async getApprovedKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
    try {
      const results = await db
        .select()
        .from(knowledgeDocuments)
        .where(
          and(
            eq(knowledgeDocuments.isActive, true),
            isNotNull(knowledgeDocuments.approvedAt)
          )
        )
        .orderBy(desc(knowledgeDocuments.createdAt));
      return results;
    } catch (error) {
      console.error('Error fetching approved knowledge documents:', error);
      return [];
    }
  }

  // Admin Credentials
  async getAdminCredentials(email: string): Promise<AdminCredentials | undefined> {
    try {
      const [creds] = await db
        .select()
        .from(adminCredentials)
        .where(eq(adminCredentials.email, email));
      return creds;
    } catch (error) {
      console.error('Error fetching admin credentials:', error);
      return undefined;
    }
  }

  async createAdminCredentials(data: InsertAdminCredentials): Promise<AdminCredentials> {
    const [creds] = await db.insert(adminCredentials).values(data).returning();
    return creds;
  }

  async updateAdminCredentials(email: string, updates: Partial<AdminCredentials>): Promise<AdminCredentials | undefined> {
    try {
      const [updated] = await db
        .update(adminCredentials)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(adminCredentials.email, email))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      return undefined;
    }
  }

  // Team Credentials
  async getTeamCredentials(email: string): Promise<TeamCredentials | undefined> {
    try {
      const [creds] = await db
        .select()
        .from(teamCredentials)
        .where(eq(teamCredentials.email, email));
      return creds;
    } catch (error) {
      console.error('Error fetching team credentials:', error);
      return undefined;
    }
  }

  async getAllTeamMembers(): Promise<TeamCredentials[]> {
    try {
      const results = await db
        .select()
        .from(teamCredentials)
        .orderBy(desc(teamCredentials.createdAt));
      return results;
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  async createTeamCredentials(data: InsertTeamCredentials): Promise<TeamCredentials> {
    const [creds] = await db.insert(teamCredentials).values(data).returning();
    return creds;
  }

  async updateTeamCredentials(email: string, updates: Partial<TeamCredentials>): Promise<TeamCredentials | undefined> {
    try {
      const [updated] = await db
        .update(teamCredentials)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(teamCredentials.email, email))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating team credentials:', error);
      return undefined;
    }
  }

  async deleteTeamCredentials(email: string): Promise<boolean> {
    try {
      await db
        .delete(teamCredentials)
        .where(eq(teamCredentials.email, email));
      return true;
    } catch (error) {
      console.error('Error deleting team credentials:', error);
      return false;
    }
  }

  // System Settings
  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key));
      return setting;
    } catch (error) {
      console.error('Error fetching system setting:', error);
      return undefined;
    }
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    try {
      return await db.select().from(systemSettings).orderBy(systemSettings.key);
    } catch (error) {
      console.error('Error fetching all system settings:', error);
      return [];
    }
  }

  async upsertSystemSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<SystemSettings> {
    try {
      const existing = await this.getSystemSetting(key);
      if (existing) {
        const [updated] = await db
          .update(systemSettings)
          .set({ value, description, updatedBy, updatedAt: new Date() })
          .where(eq(systemSettings.key, key))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(systemSettings)
          .values({ key, value, description, updatedBy })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error upserting system setting:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
