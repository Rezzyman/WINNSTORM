import type { Express, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPropertySchema, insertReportSchema, insertScanSchema, insertCrmConfigSchema, insertCrmSyncLogSchema, insertKnowledgeBaseSchema,
  insertInspectionSessionSchema, insertEvidenceAssetSchema, insertLimitlessTranscriptSchema,
  WINN_METHODOLOGY_STEPS, WinnMethodologyStep, StepRequirements, AIStepValidation, StepOverride, StepProficiency,
  recordStepPayloadSchema, recordOverridePayloadSchema
} from "@shared/schema";
import { analyzeThermalImage, generateThermalReport } from "./thermal-analysis";
import { crmManager } from './crm-integrations';
import { getAIAssistance, analyzeInspectionData, AIAssistantRequest, analyzeInspectionImage, getStepCoaching, parseTranscript, ImageAnalysisRequest } from './ai-assistant';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './auth';
import Stripe from 'stripe';
import multer from 'multer';
import { 
  parseExcelFile, parseCSVFile, autoDetectColumnMapping, applyColumnMapping, 
  validateImportRows, convertToPropertyInsert, ColumnMapping 
} from './property-import';

function getAuthenticatedUserId(req: AuthenticatedRequest, res: Response): number | null {
  if (!req.user?.dbUserId) {
    res.status(401).json({ message: "Authentication required. Please sign in." });
    return null;
  }
  return req.user.dbUserId;
}

// Step requirements and gating rules for Winn Methodology
const STEP_REQUIREMENTS: Record<WinnMethodologyStep, StepRequirements> = {
  weather_verification: {
    minPhotos: 0,
    requiredFields: ['stormDate', 'weatherSource'],
    aiValidationRequired: false,
    canSkip: false,
  },
  thermal_imaging: {
    minPhotos: 1,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: false,
  },
  terrestrial_walk: {
    minPhotos: 3,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: false,
  },
  test_squares: {
    minPhotos: 1,
    requiredFields: ['impactCount', 'squareSize'],
    aiValidationRequired: true,
    canSkip: true,
    skipReasons: ['No accessible areas', 'Owner declined', 'Safety concern'],
  },
  soft_metals: {
    minPhotos: 2,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: false,
  },
  moisture_testing: {
    minPhotos: 0,
    requiredFields: ['moistureReadings'],
    aiValidationRequired: false,
    canSkip: true,
    skipReasons: ['No moisture meter available', 'Weather conditions prevented testing', 'Owner declined'],
  },
  core_samples: {
    minPhotos: 0,
    requiredFields: [],
    aiValidationRequired: false,
    canSkip: true,
    skipReasons: ['Not required for damage type', 'Owner declined', 'Non-invasive inspection only'],
  },
  report_assembly: {
    minPhotos: 0,
    requiredFields: [],
    aiValidationRequired: false,
    canSkip: false,
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  // Note: Most authentication is handled via Firebase on the client-side
  // These endpoints are for server session management

  // User routes
  app.get("/api/user", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Update user role
  app.patch("/api/user/role", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const { role } = req.body;
    const validRoles = ['junior_consultant', 'senior_consultant', 'admin', 'client'];
    
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be one of: " + validRoles.join(', ') });
    }
    
    const updatedUser = await storage.updateUser(userId, { role });
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user role" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });

  // Complete user onboarding
  app.patch("/api/user/onboarding", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const updatedUser = await storage.updateUser(userId, { onboardingCompleted: true });
    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update onboarding status" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    try {
      const projectsList = await storage.getProjectsByConsultant(userId);
      res.json(projectsList);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Property routes
  app.get("/api/properties", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const properties = await storage.getPropertiesByUser(userId);
    res.json(properties);
  });

  app.get("/api/properties/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    res.json(property);
  });

  app.post("/api/properties", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      // Extract and validate relevant fields
      const { name, address, imageUrls, scanType, notes, captureDate } = req.body;
      
      // Validate property data
      const propertyData = insertPropertySchema.parse({
        name,
        address,
        imageUrl: imageUrls[0], // Use the first image as property image
        userId: userId
      });
      
      // Create the property
      const property = await storage.createProperty(propertyData);
      
      // Create a scan for this property with mock analysis
      const scanData = insertScanSchema.parse({
        propertyId: property.id,
        date: captureDate ? new Date(captureDate) : new Date(),
        scanType: scanType || "drone",
        deviceType: scanType === "drone" ? "DJI Mavic 2 Enterprise" : "FLIR E6-XT",
        standardImageUrl: imageUrls[0],
        thermalImageUrl: imageUrls.length > 1 ? imageUrls[1] : imageUrls[0],
        notes,
        userId: userId
      });
      
      // Create scan with mock analysis
      const scan = await storage.createScan(scanData);
      
      res.status(201).json({
        property,
        scan
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.format() });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // Property import routes
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV and Excel files are allowed'));
      }
    }
  });

  app.post("/api/properties/import/parse", requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let headers: string[];
      let rows: Record<string, any>[];

      if (file.originalname.match(/\.csv$/i)) {
        const content = file.buffer.toString('utf-8');
        const parsed = parseCSVFile(content);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        const parsed = parseExcelFile(file.buffer);
        headers = parsed.headers;
        rows = parsed.rows;
      }

      const suggestedMapping = autoDetectColumnMapping(headers);

      res.json({
        headers,
        rowCount: rows.length,
        suggestedMapping,
        preview: rows.slice(0, 5)
      });
    } catch (error: any) {
      console.error('File parse error:', error);
      res.status(500).json({ message: error.message || "Failed to parse file" });
    }
  });

  app.post("/api/properties/import/validate", requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const file = req.file;
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let rows: Record<string, any>[];

      if (file.originalname.match(/\.csv$/i)) {
        const content = file.buffer.toString('utf-8');
        rows = parseCSVFile(content).rows;
      } else {
        rows = parseExcelFile(file.buffer).rows;
      }

      const mappedRows = applyColumnMapping(rows, mapping as ColumnMapping);
      const validationResults = validateImportRows(mappedRows);

      res.json({
        totalRows: validationResults.length,
        validRows: validationResults.filter(r => r.isValid).length,
        invalidRows: validationResults.filter(r => !r.isValid).length,
        results: validationResults
      });
    } catch (error: any) {
      console.error('Validation error:', error);
      res.status(500).json({ message: error.message || "Failed to validate data" });
    }
  });

  app.post("/api/properties/import/execute", requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const file = req.file;
      const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
      const projectId = req.body.projectId ? parseInt(req.body.projectId) : undefined;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let rows: Record<string, any>[];

      if (file.originalname.match(/\.csv$/i)) {
        const content = file.buffer.toString('utf-8');
        rows = parseCSVFile(content).rows;
      } else {
        rows = parseExcelFile(file.buffer).rows;
      }

      const mappedRows = applyColumnMapping(rows, mapping as ColumnMapping);
      const validationResults = validateImportRows(mappedRows);
      
      const importedProperties = [];
      const errors: { row: number; message: string }[] = [];

      for (const result of validationResults) {
        if (!result.isValid) {
          errors.push({ row: result.row, message: result.errors.join(', ') });
          continue;
        }

        try {
          const propertyData = convertToPropertyInsert(result.data, userId, projectId);
          const property = await storage.createProperty({
            name: propertyData.name,
            address: propertyData.address,
            overallCondition: propertyData.overallCondition,
            userId: propertyData.userId,
            projectId: propertyData.projectId,
            buildingInfo: propertyData.buildingInfo as any,
            roofSystemDetails: propertyData.roofSystemDetails as any
          });
          importedProperties.push(property);
        } catch (err: any) {
          errors.push({ row: result.row, message: err.message || 'Failed to create property' });
        }
      }

      res.json({
        totalRows: validationResults.length,
        importedCount: importedProperties.length,
        skippedCount: errors.length,
        errors,
        properties: importedProperties
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({ message: error.message || "Failed to import properties" });
    }
  });

  // Scan routes
  app.get("/api/scans/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid scan ID" });
    }
    
    const scan = await storage.getScan(id);
    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }
    
    res.json(scan);
  });

  app.get("/api/properties/:id/scans", requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const scans = await storage.getScansByProperty(id);
    res.json(scans);
  });

  // Report routes
  app.post("/api/reports/send/:scanId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const scanId = parseInt(req.params.scanId);
      if (isNaN(scanId)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Get the scan
      const scan = await storage.getScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      // Create a report
      const reportData = insertReportSchema.parse({
        scanId,
        title: "Thermal Roof Assessment",
        pdfUrl: "", // In MVP, we don't actually generate a PDF
        sentTo: email,
        userId: userId
      });
      
      const report = await storage.createReport(reportData);
      
      // In a real implementation, you would generate the PDF and send an email here
      
      res.status(201).json({
        message: "Report sent successfully",
        report
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.format() });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to send report" });
    }
  });

  app.get("/api/reports/download/:scanId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const scanId = parseInt(req.params.scanId);
      if (isNaN(scanId)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const scan = await storage.getScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      if (scan.userId !== userId) {
        return res.status(403).json({ message: "Access denied - you do not own this scan" });
      }
      
      const property = await storage.getProperty(scan.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const { generateWinnReport, generateExecutiveSummary } = await import('./pdf-report-service');
      
      const executiveSummary = await generateExecutiveSummary({ property, scan });
      
      let thermalAnalysis = undefined;
      if (scan.thermalImageUrl && scan.issues && scan.issues.length > 0) {
        thermalAnalysis = {
          overallAssessment: `Thermal analysis detected ${scan.issues.length} issue(s) during the assessment. ` +
            `${scan.issues.filter(i => i.severity === 'critical').length > 0 ? 'Critical issues requiring immediate attention were identified.' : 'No critical issues were found.'}`,
          anomalies: scan.issues.map(issue => ({
            type: issue.title,
            severity: issue.severity,
            location: 'See thermal image',
            description: issue.description,
          })),
        };
      }
      
      const pdfBuffer = await generateWinnReport({
        property,
        scan,
        executiveSummary,
        thermalAnalysis,
      });
      
      const sanitizedName = property.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `WinnReport_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // AI Executive Summary Generation
  app.post("/api/reports/executive-summary/:scanId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const scanId = parseInt(req.params.scanId);
      if (isNaN(scanId)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      const scan = await storage.getScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      if (scan.userId !== userId) {
        return res.status(403).json({ message: "Access denied - you do not own this scan" });
      }
      
      const property = await storage.getProperty(scan.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
      });
      
      const issuesSummary = scan.issues && scan.issues.length > 0
        ? scan.issues.map(i => `- ${i.severity.toUpperCase()}: ${i.title} - ${i.description}`).join('\n')
        : 'No significant issues detected.';
      
      const metricsSummary = scan.metrics && scan.metrics.length > 0
        ? scan.metrics.map(m => `- ${m.name}: ${m.value}`).join('\n')
        : 'No metrics recorded.';

      const prompt = `You are a professional damage assessment consultant writing an executive summary for a thermal roof assessment report. Write a professional, concise executive summary (2-3 paragraphs) based on the following inspection data:

PROPERTY INFORMATION:
- Name: ${property.name}
- Address: ${property.address}
- Overall Condition: ${property.overallCondition || 'Not assessed'}

SCAN DETAILS:
- Date: ${scan.date ? new Date(scan.date).toLocaleDateString() : 'N/A'}
- Type: ${scan.scanType || 'Thermal'}
- Device: ${scan.deviceType || 'Professional thermal camera'}
- Health Score: ${scan.healthScore !== null ? `${scan.healthScore}/100` : 'Not calculated'}

ISSUES FOUND:
${issuesSummary}

PERFORMANCE METRICS:
${metricsSummary}

INSPECTOR NOTES:
${scan.notes || 'No additional notes.'}

Write a professional executive summary following the Winn Methodology standards. Include:
1. An opening paragraph summarizing the inspection scope and methodology
2. Key findings and their significance
3. Overall assessment and recommended next steps

Keep the tone professional and technical but accessible.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-5.1',
        messages: [
          {
            role: 'system',
            content: 'You are Stormy, the WinnStorm AI assistant specializing in professional damage assessment reports. You follow the Winn Methodology and produce clear, actionable executive summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 800,
      });

      const summary = completion.choices[0]?.message?.content || 'Unable to generate executive summary.';
      
      res.json({ 
        summary,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating AI executive summary:', error);
      
      const { generateExecutiveSummary } = await import('./pdf-report-service');
      const scan = await storage.getScan(parseInt(req.params.scanId));
      const property = scan ? await storage.getProperty(scan.propertyId) : null;
      
      if (scan && property) {
        const fallbackSummary = await generateExecutiveSummary({ property, scan });
        return res.json({ 
          summary: fallbackSummary,
          generatedAt: new Date().toISOString(),
          fallback: true
        });
      }
      
      res.status(500).json({ message: "Failed to generate executive summary" });
    }
  });

  // CRM Configuration routes
  app.get("/api/crm/configs", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const configs = await storage.getCrmConfigsByUser(userId);
      res.json(configs);
    } catch (error) {
      console.error('Error fetching CRM configs:', error);
      res.status(500).json({ message: "Failed to fetch CRM configurations" });
    }
  });

  app.post("/api/crm/configs", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const configData = insertCrmConfigSchema.parse(req.body);
      const config = await storage.createCrmConfig({
        ...configData,
        userId: userId
      });
      
      // Add configuration to CRM manager
      crmManager.addIntegration(config.name, {
        type: config.type as any,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        webhookUrl: config.webhookUrl || undefined,
        customFields: config.customFields || undefined
      });
      
      res.json(config);
    } catch (error) {
      console.error('Error creating CRM config:', error);
      res.status(500).json({ message: "Failed to create CRM configuration" });
    }
  });

  app.put("/api/crm/configs/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      const updateData = insertCrmConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateCrmConfig(id, updateData);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating CRM config:', error);
      res.status(500).json({ message: "Failed to update CRM configuration" });
    }
  });

  app.delete("/api/crm/configs/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      const deleted = await storage.deleteCrmConfig(id);
      if (!deleted) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({ message: "Configuration deleted successfully" });
    } catch (error) {
      console.error('Error deleting CRM config:', error);
      res.status(500).json({ message: "Failed to delete CRM configuration" });
    }
  });

  // CRM Sync routes
  app.post("/api/crm/sync/property", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { crmConfigId, propertyId, ownerInfo } = req.body;
      
      if (!crmConfigId || !propertyId || !ownerInfo) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const config = await storage.getCrmConfig(crmConfigId);
      if (!config) {
        return res.status(404).json({ message: "CRM configuration not found" });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get the latest scan for the property
      const scans = await storage.getScansByProperty(propertyId);
      if (scans.length === 0) {
        return res.status(400).json({ message: "No scans found for property" });
      }
      
      const latestScan = scans.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      // Sync to CRM
      const syncResults = await crmManager.syncPropertyToCRM(
        config.name,
        property,
        latestScan,
        ownerInfo
      );
      
      // Log sync results
      for (const result of syncResults) {
        await storage.createCrmSyncLog({
          crmConfigId: config.id,
          propertyId: property.id,
          scanId: latestScan.id,
          syncType: result.contactId ? 'contact' : 'job',
          externalId: result.contactId || result.jobId,
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error
        });
      }
      
      res.json({ results: syncResults });
    } catch (error) {
      console.error('Error syncing to CRM:', error);
      res.status(500).json({ message: "Failed to sync to CRM" });
    }
  });

  app.get("/api/crm/sync/logs/:configId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const configId = parseInt(req.params.configId);
      if (isNaN(configId)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      const logs = await storage.getCrmSyncLogsByConfig(configId);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });

  // Team Assignment & Workload Management routes
  app.get("/api/team/assignments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const assignments = await storage.getAllTeamAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching team assignments:', error);
      res.status(500).json({ message: "Failed to fetch team assignments" });
    }
  });

  app.get("/api/team/assignments/:inspectorId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const inspectorId = parseInt(req.params.inspectorId);
      if (isNaN(inspectorId)) {
        return res.status(400).json({ message: "Invalid inspector ID" });
      }
      
      const assignment = await storage.getTeamAssignment(inspectorId);
      if (!assignment) {
        return res.status(404).json({ message: "Team assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error('Error fetching team assignment:', error);
      res.status(500).json({ message: "Failed to fetch team assignment" });
    }
  });

  app.post("/api/team/assignments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const assignment = await storage.createTeamAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating team assignment:', error);
      res.status(500).json({ message: "Failed to create team assignment" });
    }
  });

  app.put("/api/team/assignments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const updated = await storage.updateTeamAssignment(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Team assignment not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating team assignment:', error);
      res.status(500).json({ message: "Failed to update team assignment" });
    }
  });

  app.delete("/api/team/assignments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const deleted = await storage.deleteTeamAssignment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Team assignment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting team assignment:', error);
      res.status(500).json({ message: "Failed to delete team assignment" });
    }
  });

  // Workload Dashboard API
  app.get("/api/team/workload", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const assignments = await storage.getAllTeamAssignments();
      const workloadData = [];
      
      for (const assignment of assignments) {
        const inspections = await storage.getScheduledInspectionsByInspector(
          assignment.inspectorId, startOfWeek, endOfWeek
        );
        
        const inspector = await storage.getUser(assignment.inspectorId);
        
        workloadData.push({
          inspectorId: assignment.inspectorId,
          inspectorName: inspector ? `${inspector.firstName} ${inspector.lastName}` : 'Unknown',
          teamName: assignment.teamName,
          region: assignment.region,
          maxDaily: assignment.maxDailyInspections,
          maxWeekly: assignment.maxWeeklyInspections,
          currentWeekly: inspections.length,
          isAvailable: assignment.isAvailable,
          unavailableUntil: assignment.unavailableUntil,
          specializations: assignment.specializations,
          utilizationPercent: Math.round((inspections.length / (assignment.maxWeeklyInspections || 20)) * 100)
        });
      }
      
      res.json(workloadData);
    } catch (error) {
      console.error('Error fetching workload data:', error);
      res.status(500).json({ message: "Failed to fetch workload data" });
    }
  });

  // Damage Templates routes
  app.get("/api/damage-templates", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const category = req.query.category as string;
      
      let templates;
      if (category) {
        templates = await storage.getDamageTemplatesByCategory(category);
      } else {
        templates = await storage.getAllDamageTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching damage templates:', error);
      res.status(500).json({ message: "Failed to fetch damage templates" });
    }
  });

  app.get("/api/damage-templates/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getDamageTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Damage template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error fetching damage template:', error);
      res.status(500).json({ message: "Failed to fetch damage template" });
    }
  });

  app.post("/api/damage-templates", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const template = await storage.createDamageTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating damage template:', error);
      res.status(500).json({ message: "Failed to create damage template" });
    }
  });

  app.put("/api/damage-templates/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const updated = await storage.updateDamageTemplate(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Damage template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating damage template:', error);
      res.status(500).json({ message: "Failed to update damage template" });
    }
  });

  app.delete("/api/damage-templates/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const deleted = await storage.deleteDamageTemplate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Damage template not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting damage template:', error);
      res.status(500).json({ message: "Failed to delete damage template" });
    }
  });

  // Seed default damage templates (admin only)
  app.post("/api/damage-templates/seed", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const existingTemplates = await storage.getAllDamageTemplates();
      if (existingTemplates.length > 0) {
        return res.json({ message: "Templates already seeded", count: existingTemplates.length });
      }
      
      const defaultTemplates = [
        {
          name: "Hail Impact Damage",
          category: "Storm Damage",
          damageType: "hail",
          description: "Circular or irregular indentations caused by hail impact on roofing materials. May show exposed substrate or granule loss.",
          defaultSeverity: "warning",
          affectedComponents: ["shingles", "metal panels", "gutters", "vents"],
          typicalCauses: ["Hailstorm", "Severe weather"],
          recommendations: [
            { action: "Document all impact locations with close-up photos", priority: "immediate" as const },
            { action: "Measure and record largest hail diameter impacts", priority: "immediate" as const },
            { action: "Schedule full roof replacement assessment", priority: "short_term" as const, estimatedCost: "$8,000-$15,000" }
          ],
          inspectionNotes: "Check soft metals (vents, gutters) first as they show clearest evidence of hail size",
          requiredEvidence: ["overview_photo", "close_up_damage", "soft_metal_impacts", "test_square"]
        },
        {
          name: "Wind Uplift Damage",
          category: "Storm Damage",
          damageType: "wind",
          description: "Shingles lifted, creased, or missing due to high wind events. May show exposed underlayment or decking.",
          defaultSeverity: "critical",
          affectedComponents: ["shingles", "ridge caps", "drip edge", "fascia"],
          typicalCauses: ["High winds", "Tornado", "Hurricane"],
          recommendations: [
            { action: "Emergency tarping to prevent water intrusion", priority: "immediate" as const, estimatedCost: "$200-$500" },
            { action: "Full roof inspection once weather permits", priority: "short_term" as const },
            { action: "Replace damaged sections or full roof", priority: "short_term" as const, estimatedCost: "$5,000-$20,000" }
          ],
          inspectionNotes: "Check corners and edges first - wind damage typically starts at perimeter",
          requiredEvidence: ["wide_angle_damage", "missing_material", "underlayment_exposure"]
        },
        {
          name: "Thermal Bridging",
          category: "Thermal Issues",
          damageType: "thermal",
          description: "Heat transfer through building components visible in thermal imaging. Indicates insulation gaps or structural thermal bridges.",
          defaultSeverity: "warning",
          affectedComponents: ["insulation", "framing", "fasteners", "penetrations"],
          typicalCauses: ["Poor insulation", "Missing vapor barrier", "Improper installation"],
          recommendations: [
            { action: "Mark locations for remediation", priority: "short_term" as const },
            { action: "Add insulation at thermal bridges", priority: "long_term" as const, estimatedCost: "$1,000-$5,000" }
          ],
          inspectionNotes: "Best detected during significant indoor/outdoor temperature differential (>20°F)",
          requiredEvidence: ["thermal_image", "standard_image", "temperature_readings"]
        },
        {
          name: "Moisture Intrusion",
          category: "Water Damage",
          damageType: "moisture",
          description: "Water infiltration detected through thermal imaging showing cooler areas or moisture meter readings above threshold.",
          defaultSeverity: "critical",
          affectedComponents: ["decking", "insulation", "membrane", "flashing"],
          typicalCauses: ["Failed sealant", "Puncture", "Flashing failure", "Clogged drains"],
          recommendations: [
            { action: "Core sample to assess decking condition", priority: "immediate" as const },
            { action: "Locate and repair water entry point", priority: "immediate" as const, estimatedCost: "$500-$2,000" },
            { action: "Replace saturated insulation and decking", priority: "short_term" as const, estimatedCost: "$3,000-$10,000" }
          ],
          inspectionNotes: "Use moisture meter to confirm thermal anomalies. Document moisture readings at each location.",
          requiredEvidence: ["thermal_image", "moisture_reading", "core_sample"]
        },
        {
          name: "Granule Loss",
          category: "Material Degradation",
          damageType: "wear",
          description: "Surface granules missing from asphalt shingles, exposing underlying asphalt. May be age-related or impact damage.",
          defaultSeverity: "warning",
          affectedComponents: ["shingles"],
          typicalCauses: ["Age", "Hail impact", "Foot traffic", "Manufacturing defect"],
          recommendations: [
            { action: "Check gutters and downspouts for granule accumulation", priority: "immediate" as const },
            { action: "Document extent of granule loss", priority: "immediate" as const },
            { action: "Plan for roof replacement within 3-5 years", priority: "long_term" as const, estimatedCost: "$8,000-$15,000" }
          ],
          inspectionNotes: "Distinguish between natural aging (uniform loss) and hail damage (concentrated impact patterns)",
          requiredEvidence: ["close_up_photo", "granule_sample", "age_assessment"]
        },
        {
          name: "Flashing Failure",
          category: "Penetration Issues",
          damageType: "flashing",
          description: "Deteriorated, lifted, or improperly installed flashing around roof penetrations, walls, or edges.",
          defaultSeverity: "critical",
          affectedComponents: ["flashing", "sealant", "membrane"],
          typicalCauses: ["Age", "Thermal cycling", "Poor installation", "Storm damage"],
          recommendations: [
            { action: "Apply emergency sealant if active leak", priority: "immediate" as const, estimatedCost: "$100-$300" },
            { action: "Replace failed flashing and sealant", priority: "short_term" as const, estimatedCost: "$500-$2,000" }
          ],
          inspectionNotes: "Check all penetrations: vents, pipes, chimneys, HVAC units, skylights",
          requiredEvidence: ["flashing_photo", "sealant_condition", "water_staining"]
        }
      ];
      
      const createdTemplates = [];
      for (const template of defaultTemplates) {
        const created = await storage.createDamageTemplate(template as any);
        createdTemplates.push(created);
      }
      
      res.status(201).json({ message: "Templates seeded", count: createdTemplates.length, templates: createdTemplates });
    } catch (error) {
      console.error('Error seeding damage templates:', error);
      res.status(500).json({ message: "Failed to seed damage templates" });
    }
  });

  // Thermal Analysis API routes
  app.post("/api/thermal/analyze", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { imageBase64, metadata } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }
      
      if (!metadata || !metadata.location) {
        return res.status(400).json({ message: "Image metadata with location is required" });
      }
      
      const analysisResult = await analyzeThermalImage(imageBase64, {
        location: metadata.location,
        timestamp: metadata.timestamp ? new Date(metadata.timestamp) : new Date(),
        ambientTemp: metadata.ambientTemp,
        humidity: metadata.humidity
      });
      
      res.json(analysisResult);
    } catch (error) {
      console.error('Thermal analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze thermal image", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/thermal/generate-report", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { analysisResults, buildingInfo } = req.body;
      
      if (!analysisResults || !Array.isArray(analysisResults)) {
        return res.status(400).json({ message: "Analysis results array is required" });
      }
      
      if (!buildingInfo) {
        return res.status(400).json({ message: "Building information is required" });
      }
      
      const reportSummary = await generateThermalReport(analysisResults, buildingInfo);
      
      res.json({ summary: reportSummary });
    } catch (error) {
      console.error('Thermal report generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate thermal report", 
        error: (error as Error).message 
      });
    }
  });

  // AI Assistant routes
  app.post("/api/ai-assistant", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { message, context, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const assistantRequest: AIAssistantRequest = {
        message,
        context: context || "General roof inspection assistance",
        conversationHistory: conversationHistory || []
      };
      
      const response = await getAIAssistance(assistantRequest);
      
      res.json(response);
    } catch (error) {
      console.error('AI Assistant error:', error);
      res.status(500).json({ 
        message: "Failed to get AI assistance", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/ai-assistant/analyze-inspection", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { thermalReadings, roofSections, weatherData, inspectionType } = req.body;
      
      if (!inspectionType) {
        return res.status(400).json({ message: "Inspection type is required" });
      }
      
      const analysisResult = await analyzeInspectionData({
        thermalReadings,
        roofSections,
        weatherData,
        inspectionType
      });
      
      res.json(analysisResult);
    } catch (error) {
      console.error('AI Inspection analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze inspection data", 
        error: (error as Error).message 
      });
    }
  });

  // Stripe subscription routes
  app.post("/api/create-subscription", async (req, res) => {
    try {
      // Prefer testing keys for development, fall back to production keys
      const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-10-29.clover',
      });

      const { plan, email } = req.body;

      // Map plan names to Stripe price IDs (configured in Stripe Dashboard)
      // For development without price IDs, we'll create ad-hoc prices
      const priceMap: Record<string, string> = {
        'starter': process.env.STRIPE_PRICE_STARTER || '',
        'professional': process.env.STRIPE_PRICE_PROFESSIONAL || '',
        'enterprise': process.env.STRIPE_PRICE_ENTERPRISE || ''
      };

      // Plan pricing in cents for development mode
      const planPricing: Record<string, number> = {
        'starter': 4900,        // $49/month
        'professional': 14900,  // $149/month
        'enterprise': 49900     // $499/month
      };

      const planLower = plan?.toLowerCase() || 'starter';
      let priceId = priceMap[planLower];
      
      // If no price ID is configured, create an ad-hoc price for development
      if (!priceId) {
        console.log(`No Stripe price ID for plan: ${plan}. Creating ad-hoc price for development.`);
        
        // First create or get a product
        const products = await stripe.products.list({ limit: 1 });
        let productId: string;
        
        if (products.data.length > 0) {
          productId = products.data[0].id;
        } else {
          const product = await stripe.products.create({
            name: 'WinnStorm Subscription',
            description: 'WinnStorm damage assessment platform subscription',
          });
          productId = product.id;
        }
        
        // Create a price for this subscription
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: planPricing[planLower] || 4900,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        priceId = price.id;
      }

      // Create a customer with email if provided
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          plan: plan,
        },
      });

      // Create a PaymentIntent for the subscription using the invoice approach
      // First create an incomplete subscription, then finalize the invoice
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Get the payment intent from the invoice
      // Since we expanded 'latest_invoice.payment_intent', the invoice includes payment_intent
      const invoice = subscription.latest_invoice;
      
      if (!invoice || typeof invoice === 'string') {
        console.error('Subscription created but invoice not expanded');
        return res.status(500).json({ 
          message: "Subscription created but invoice not available. Please contact support.",
          subscriptionId: subscription.id
        });
      }

      // Access payment_intent from expanded invoice (need to cast as it's an expanded relation)
      let paymentIntent = (invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null }).payment_intent;
      
      // If payment_intent is a string (not expanded) or null, try to finalize the invoice
      if ((!paymentIntent || typeof paymentIntent === 'string') && invoice.id) {
        try {
          const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            expand: ['payment_intent'],
          });
          paymentIntent = (finalizedInvoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null }).payment_intent;
        } catch (finalizeError) {
          console.error('Error finalizing invoice:', finalizeError);
        }
      }

      // Validate we have a proper PaymentIntent with client_secret
      if (!paymentIntent || typeof paymentIntent === 'string' || !paymentIntent.client_secret) {
        // Fall back to creating a setup intent for the customer
        console.log('Creating setup intent as fallback for customer:', customer.id);
        const setupIntent = await stripe.setupIntents.create({
          customer: customer.id,
          payment_method_types: ['card'],
          metadata: {
            subscriptionId: subscription.id,
          },
        });

        return res.json({
          subscriptionId: subscription.id,
          clientSecret: setupIntent.client_secret,
          setupMode: true,
        });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      res.status(500).json({ 
        message: "Failed to create subscription", 
        error: (error as Error).message 
      });
    }
  });

  // Knowledge Base routes
  app.get("/api/knowledge", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { search, workflowStep } = req.query;
      
      if (search) {
        const entries = await storage.searchKnowledge(
          String(search),
          workflowStep ? String(workflowStep) : undefined
        );
        return res.json(entries);
      }
      
      const entries = await storage.getAllKnowledgeEntries();
      res.json(entries);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });

  app.get("/api/knowledge/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid knowledge entry ID" });
      }
      
      const entry = await storage.getKnowledgeEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Knowledge entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error('Error fetching knowledge entry:', error);
      res.status(500).json({ message: "Failed to fetch knowledge entry" });
    }
  });

  app.post("/api/knowledge", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const entryData = insertKnowledgeBaseSchema.parse(req.body);
      const entry = await storage.createKnowledgeEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid knowledge entry data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create knowledge entry" });
    }
  });

  app.patch("/api/knowledge/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid knowledge entry ID" });
      }
      
      const updatedEntry = await storage.updateKnowledgeEntry(id, req.body);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Knowledge entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      res.status(500).json({ message: "Failed to update knowledge entry" });
    }
  });

  app.delete("/api/knowledge/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid knowledge entry ID" });
      }
      
      const deleted = await storage.deleteKnowledgeEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Knowledge entry not found" });
      }
      
      res.json({ message: "Knowledge entry deleted successfully" });
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      res.status(500).json({ message: "Failed to delete knowledge entry" });
    }
  });

  // ============================================================================
  // INSPECTION SESSION ROUTES - Winn Methodology Workflow Engine
  // ============================================================================

  // Get step requirements configuration
  app.get("/api/inspection/step-requirements", async (req, res) => {
    res.json({
      steps: WINN_METHODOLOGY_STEPS,
      requirements: STEP_REQUIREMENTS,
    });
  });

  // Get step-specific coaching content (query param version)
  app.get("/api/inspection/coaching", async (req, res) => {
    try {
      const step = req.query.step as WinnMethodologyStep;
      const experienceLevel = (req.query.level as 'beginner' | 'intermediate' | 'expert') || 'beginner';
      
      if (!step || !WINN_METHODOLOGY_STEPS.includes(step)) {
        return res.status(400).json({ 
          message: "Invalid or missing methodology step",
          validSteps: WINN_METHODOLOGY_STEPS 
        });
      }

      const coaching = await getStepCoaching(step, experienceLevel);
      res.json(coaching);

    } catch (error) {
      console.error('Error getting coaching content:', error);
      res.status(500).json({ message: "Failed to get coaching content" });
    }
  });

  // Get or create active inspection session for a property
  app.get("/api/inspection/session/active", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const propertyId = parseInt(req.query.propertyId as string);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      let session = await storage.getActiveInspectionSession(propertyId, userId);
      
      if (!session) {
        // Create new session
        session = await storage.createInspectionSession({
          propertyId,
          inspectorId: userId,
        });
      }

      // Get evidence for this session
      const evidence = await storage.getEvidenceAssetsBySession(session.id);
      
      // Get property info
      const property = await storage.getProperty(propertyId);

      res.json({
        session,
        evidence,
        property,
        stepRequirements: STEP_REQUIREMENTS,
      });
    } catch (error) {
      console.error('Error fetching active inspection session:', error);
      res.status(500).json({ message: "Failed to fetch inspection session" });
    }
  });

  // Get single inspection session by ID
  app.get("/api/inspection/session/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getInspectionSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const evidence = await storage.getEvidenceAssetsBySession(id);
      const property = await storage.getProperty(session.propertyId);

      res.json({
        session,
        evidence,
        property,
        stepRequirements: STEP_REQUIREMENTS,
      });
    } catch (error) {
      console.error('Error fetching inspection session:', error);
      res.status(500).json({ message: "Failed to fetch inspection session" });
    }
  });

  // Get all inspection sessions for current user
  app.get("/api/inspection/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const sessions = await storage.getInspectionSessionsByInspector(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching inspection sessions:', error);
      res.status(500).json({ message: "Failed to fetch inspection sessions" });
    }
  });

  // Create new inspection session
  app.post("/api/inspection/session", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const sessionData = insertInspectionSessionSchema.parse({
        ...req.body,
        inspectorId: userId,
      });
      
      const session = await storage.createInspectionSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating inspection session:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inspection session" });
    }
  });

  // Update inspection session
  app.patch("/api/inspection/session/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const updatedSession = await storage.updateInspectionSession(id, req.body);
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error('Error updating inspection session:', error);
      res.status(500).json({ message: "Failed to update inspection session" });
    }
  });

  // Validate step completion and advance to next step
  app.post("/api/inspection/session/:id/advance", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getInspectionSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const currentStep = session.currentStep as WinnMethodologyStep;
      const currentStepIndex = WINN_METHODOLOGY_STEPS.indexOf(currentStep);
      
      if (currentStepIndex === -1) {
        return res.status(400).json({ message: "Invalid current step" });
      }

      // Check step requirements
      const requirements = STEP_REQUIREMENTS[currentStep];
      const evidence = await storage.getEvidenceAssetsByStep(id, currentStep);
      
      // Validate minimum photos
      if (evidence.length < requirements.minPhotos) {
        return res.status(400).json({
          message: `Step requires at least ${requirements.minPhotos} photos`,
          current: evidence.length,
          required: requirements.minPhotos,
          canSkip: requirements.canSkip,
          skipReasons: requirements.skipReasons,
        });
      }

      // Check AI validation if required
      if (requirements.aiValidationRequired) {
        const hasValidation = evidence.some(e => e.aiAnalysis?.isValid);
        if (!hasValidation) {
          return res.status(400).json({
            message: "AI validation required before advancing",
            hint: "Upload evidence and analyze with Stormy before proceeding",
            canSkip: requirements.canSkip,
            skipReasons: requirements.skipReasons,
          });
        }
      }

      // Advance to next step
      if (currentStepIndex === WINN_METHODOLOGY_STEPS.length - 1) {
        // Last step - complete the session
        const completedSession = await storage.completeInspectionSession(id);
        return res.json({
          session: completedSession,
          message: "Inspection completed!",
          nextStep: null,
        });
      }

      const nextStep = WINN_METHODOLOGY_STEPS[currentStepIndex + 1];
      const updatedSession = await storage.advanceInspectionStep(id, nextStep);

      res.json({
        session: updatedSession,
        previousStep: currentStep,
        nextStep,
        message: `Advanced from ${currentStep} to ${nextStep}`,
      });
    } catch (error) {
      console.error('Error advancing inspection step:', error);
      res.status(500).json({ message: "Failed to advance inspection step" });
    }
  });

  // Skip current step with reason (compliance tracking)
  app.post("/api/inspection/session/:id/skip", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Skip reason required" });
      }

      const session = await storage.getInspectionSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const currentStep = session.currentStep as WinnMethodologyStep;
      const currentStepIndex = WINN_METHODOLOGY_STEPS.indexOf(currentStep);
      const requirements = STEP_REQUIREMENTS[currentStep];

      if (!requirements.canSkip) {
        return res.status(400).json({
          message: `Step '${currentStep}' cannot be skipped`,
          hint: "This step is required by the Winn Methodology",
        });
      }

      if (requirements.skipReasons && !requirements.skipReasons.includes(reason)) {
        return res.status(400).json({
          message: "Invalid skip reason",
          validReasons: requirements.skipReasons,
        });
      }

      // Record the override
      const overrides = session.overrides || [];
      overrides.push({
        step: currentStep,
        reason,
        timestamp: new Date().toISOString(),
      });

      // Update step data to show skipped
      const stepData = session.stepData || {} as any;
      stepData[currentStep] = {
        completed: false,
        skipped: true,
        skipReason: reason,
        evidenceCount: 0,
        notes: `Skipped: ${reason}`,
        findings: [],
      };

      // Advance to next step
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex >= WINN_METHODOLOGY_STEPS.length) {
        // Can't skip the final step
        return res.status(400).json({ message: "Cannot skip the final step" });
      }

      const nextStep = WINN_METHODOLOGY_STEPS[nextStepIndex];
      
      // Calculate compliance score penalty
      const currentScore = session.complianceScore || 100;
      const penalty = requirements.canSkip ? 5 : 20; // Higher penalty for required steps

      const updatedSession = await storage.updateInspectionSession(id, {
        currentStep: nextStep,
        stepsCompleted: [...(session.stepsCompleted || []), currentStep],
        stepData,
        overrides,
        complianceScore: Math.max(0, currentScore - penalty),
      });

      res.json({
        session: updatedSession,
        previousStep: currentStep,
        nextStep,
        message: `Skipped ${currentStep} (reason: ${reason})`,
        complianceImpact: `-${penalty} points`,
      });
    } catch (error) {
      console.error('Error skipping inspection step:', error);
      res.status(500).json({ message: "Failed to skip inspection step" });
    }
  });

  // Complete inspection session
  app.post("/api/inspection/session/:id/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getInspectionSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify we're on the last step
      if (session.currentStep !== 'report_assembly') {
        return res.status(400).json({
          message: "Cannot complete inspection before Report Assembly step",
          currentStep: session.currentStep,
        });
      }

      const completedSession = await storage.completeInspectionSession(id);
      res.json({
        session: completedSession,
        message: "Inspection completed successfully!",
      });
    } catch (error) {
      console.error('Error completing inspection session:', error);
      res.status(500).json({ message: "Failed to complete inspection session" });
    }
  });

  // ============================================================================
  // EVIDENCE ASSET ROUTES - Photo/Thermal/Document Upload
  // ============================================================================

  // Get evidence for a session
  app.get("/api/inspection/session/:sessionId/evidence", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const step = req.query.step as WinnMethodologyStep | undefined;
      
      let evidence;
      if (step && WINN_METHODOLOGY_STEPS.includes(step)) {
        evidence = await storage.getEvidenceAssetsByStep(sessionId, step);
      } else {
        evidence = await storage.getEvidenceAssetsBySession(sessionId);
      }

      res.json(evidence);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      res.status(500).json({ message: "Failed to fetch evidence" });
    }
  });

  // Upload new evidence asset
  app.post("/api/inspection/evidence", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const assetData = insertEvidenceAssetSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });
      
      const asset = await storage.createEvidenceAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error creating evidence asset:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evidence data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create evidence asset" });
    }
  });

  // Update evidence asset (e.g., add AI analysis)
  app.patch("/api/inspection/evidence/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid evidence ID" });
      }

      const updatedAsset = await storage.updateEvidenceAsset(id, req.body);
      if (!updatedAsset) {
        return res.status(404).json({ message: "Evidence asset not found" });
      }

      res.json(updatedAsset);
    } catch (error) {
      console.error('Error updating evidence asset:', error);
      res.status(500).json({ message: "Failed to update evidence asset" });
    }
  });

  // Delete evidence asset
  app.delete("/api/inspection/evidence/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid evidence ID" });
      }

      const deleted = await storage.deleteEvidenceAsset(id);
      if (!deleted) {
        return res.status(404).json({ message: "Evidence asset not found" });
      }

      res.json({ message: "Evidence asset deleted successfully" });
    } catch (error) {
      console.error('Error deleting evidence asset:', error);
      res.status(500).json({ message: "Failed to delete evidence asset" });
    }
  });

  // ============================================================================
  // SCHEDULING ROUTES - Multi-property scheduling and route optimization
  // ============================================================================

  // Get scheduled inspections for a date range
  app.get("/api/schedule", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { startDate, endDate, inspectorId } = req.query;
      const targetInspectorId = inspectorId ? parseInt(inspectorId as string) : userId;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const inspections = await storage.getScheduledInspectionsByInspector(
        targetInspectorId,
        start,
        end
      );
      
      res.json(inspections);
    } catch (error) {
      console.error('Error fetching scheduled inspections:', error);
      res.status(500).json({ message: "Failed to fetch scheduled inspections" });
    }
  });

  // Get single scheduled inspection
  app.get("/api/schedule/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inspection ID" });
      }
      
      const inspection = await storage.getScheduledInspection(id);
      if (!inspection) {
        return res.status(404).json({ message: "Scheduled inspection not found" });
      }
      
      // Verify ownership
      if (inspection.inspectorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(inspection);
    } catch (error) {
      console.error('Error fetching scheduled inspection:', error);
      res.status(500).json({ message: "Failed to fetch scheduled inspection" });
    }
  });

  // Create scheduled inspection
  app.post("/api/schedule", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { propertyId, scheduledDate, scheduledTime, estimatedDuration, priority, notes, accessInstructions, contactName, contactPhone, latitude, longitude } = req.body;
      
      if (!propertyId || !scheduledDate) {
        return res.status(400).json({ message: "propertyId and scheduledDate are required" });
      }
      
      const inspection = await storage.createScheduledInspection({
        propertyId,
        inspectorId: userId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        estimatedDuration: estimatedDuration || 60,
        status: 'scheduled',
        priority: priority || 'normal',
        notes,
        accessInstructions,
        contactName,
        contactPhone,
        latitude,
        longitude,
      });
      
      res.status(201).json(inspection);
    } catch (error) {
      console.error('Error creating scheduled inspection:', error);
      res.status(500).json({ message: "Failed to create scheduled inspection" });
    }
  });

  // Update scheduled inspection
  app.patch("/api/schedule/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inspection ID" });
      }
      
      // Verify ownership before updating
      const existing = await storage.getScheduledInspection(id);
      if (!existing) {
        return res.status(404).json({ message: "Scheduled inspection not found" });
      }
      if (existing.inspectorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only allow safe fields to be updated
      const { scheduledDate, scheduledTime, estimatedDuration, priority, notes, accessInstructions, contactName, contactPhone, status } = req.body;
      const safeUpdates: Record<string, any> = {};
      
      if (scheduledDate !== undefined) {
        const parsedDate = new Date(scheduledDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid scheduledDate format" });
        }
        safeUpdates.scheduledDate = parsedDate;
      }
      if (scheduledTime !== undefined) safeUpdates.scheduledTime = scheduledTime;
      if (estimatedDuration !== undefined) safeUpdates.estimatedDuration = parseInt(estimatedDuration) || 60;
      if (priority !== undefined && ['low', 'normal', 'high', 'urgent'].includes(priority)) safeUpdates.priority = priority;
      if (notes !== undefined) safeUpdates.notes = notes;
      if (accessInstructions !== undefined) safeUpdates.accessInstructions = accessInstructions;
      if (contactName !== undefined) safeUpdates.contactName = contactName;
      if (contactPhone !== undefined) safeUpdates.contactPhone = contactPhone;
      if (status !== undefined && ['scheduled', 'in_progress', 'completed'].includes(status)) safeUpdates.status = status;
      
      const updated = await storage.updateScheduledInspection(id, safeUpdates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating scheduled inspection:', error);
      res.status(500).json({ message: "Failed to update scheduled inspection" });
    }
  });

  // Cancel scheduled inspection
  app.post("/api/schedule/:id/cancel", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid inspection ID" });
      }
      
      // Verify ownership before cancelling
      const existing = await storage.getScheduledInspection(id);
      if (!existing) {
        return res.status(404).json({ message: "Scheduled inspection not found" });
      }
      if (existing.inspectorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { reason } = req.body;
      if (!reason || typeof reason !== 'string' || reason.length < 3) {
        return res.status(400).json({ message: "Cancellation reason is required (min 3 characters)" });
      }
      
      const cancelled = await storage.cancelScheduledInspection(id, reason);
      res.json(cancelled);
    } catch (error) {
      console.error('Error cancelling scheduled inspection:', error);
      res.status(500).json({ message: "Failed to cancel scheduled inspection" });
    }
  });

  // Get inspections for a specific date (for calendar views)
  app.get("/api/schedule/date/:date", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const inspectorId = req.query.inspectorId ? parseInt(req.query.inspectorId as string) : userId;
      const inspections = await storage.getScheduledInspectionsByDate(date, inspectorId);
      
      res.json(inspections);
    } catch (error) {
      console.error('Error fetching inspections by date:', error);
      res.status(500).json({ message: "Failed to fetch inspections by date" });
    }
  });

  // ============================================================================
  // MULTIMODAL AI ANALYSIS ROUTES - GPT-5.1 Vision & Coaching
  // ============================================================================

  // Analyze an image using GPT-5.1 vision
  app.post("/api/ai/analyze-image", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { imageUrl, imageType, step, propertyContext, previousFindings } = req.body;
      
      if (!imageUrl || !step) {
        return res.status(400).json({ message: "imageUrl and step are required" });
      }

      if (!WINN_METHODOLOGY_STEPS.includes(step)) {
        return res.status(400).json({ 
          message: "Invalid methodology step",
          validSteps: WINN_METHODOLOGY_STEPS 
        });
      }

      const analysisRequest: ImageAnalysisRequest = {
        imageUrl,
        imageType: imageType || 'photo',
        step,
        propertyContext,
        previousFindings
      };

      const result = await analyzeInspectionImage(analysisRequest);
      res.json(result);

    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // Analyze image and update evidence asset with results
  app.post("/api/inspection/evidence/:id/analyze", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid evidence ID" });
      }

      const evidence = await storage.getEvidenceAsset(id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence asset not found" });
      }

      // Get session for property context
      const session = await storage.getInspectionSession(evidence.inspectionSessionId);
      let propertyContext = '';
      if (session) {
        const property = await storage.getProperty(session.propertyId);
        if (property) {
          propertyContext = `Property: ${property.name} at ${property.address}`;
        }
      }

      // Analyze the image
      const analysisRequest: ImageAnalysisRequest = {
        imageUrl: evidence.fileUrl,
        imageType: evidence.assetType as 'photo' | 'thermal' | 'drone' | 'document',
        step: evidence.step as WinnMethodologyStep,
        propertyContext
      };

      const result = await analyzeInspectionImage(analysisRequest);

      // Update evidence with analysis results
      const updatedEvidence = await storage.updateEvidenceAsset(id, {
        aiAnalysis: result.validation,
        rawAiResponse: JSON.stringify(result)
      });

      res.json({
        evidence: updatedEvidence,
        analysis: result
      });

    } catch (error) {
      console.error('Error analyzing evidence:', error);
      res.status(500).json({ message: "Failed to analyze evidence" });
    }
  });

  // Get step-specific coaching content
  app.get("/api/ai/coaching/:step", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const step = req.params.step as WinnMethodologyStep;
      
      if (!WINN_METHODOLOGY_STEPS.includes(step)) {
        return res.status(400).json({ 
          message: "Invalid methodology step",
          validSteps: WINN_METHODOLOGY_STEPS 
        });
      }

      const experienceLevel = (req.query.level as 'beginner' | 'intermediate' | 'expert') || 'beginner';
      const findingsParam = req.query.findings as string;
      const currentFindings = findingsParam ? findingsParam.split(',') : undefined;

      const coaching = await getStepCoaching(step, experienceLevel, currentFindings);
      res.json(coaching);

    } catch (error) {
      console.error('Error getting coaching content:', error);
      res.status(500).json({ message: "Failed to get coaching content" });
    }
  });

  // Chat with Stormy - conversational AI endpoint
  app.post("/api/ai/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const { currentStep, experienceLevel, propertyId, sessionId, evidenceCount, recentMessages } = context || {};

      // Build contextual system prompt
      let systemContext = `You are Stormy, an AI assistant for WinnStorm damage assessment consultants. You are friendly, helpful, and knowledgeable about the Winn Methodology for roof and property damage assessment.`;
      
      if (currentStep) {
        systemContext += `\n\nThe consultant is currently working on the "${currentStep.replace(/_/g, ' ')}" step of the Winn Methodology.`;
      }
      
      if (experienceLevel) {
        systemContext += ` They are at the ${experienceLevel} level.`;
        if (experienceLevel === 'beginner') {
          systemContext += ` Provide detailed explanations and encourage questions.`;
        } else if (experienceLevel === 'expert') {
          systemContext += ` Be concise and technical.`;
        }
      }

      if (evidenceCount !== undefined) {
        systemContext += `\n\nThey have captured ${evidenceCount} pieces of evidence so far for this step.`;
      }

      // Use the AI assistant to generate response
      const aiResponse = await getAIAssistance({
        context: systemContext,
        message: message,
      });

      res.json({ 
        response: aiResponse.response,
        suggestedActions: aiResponse.suggestions || []
      });

    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // Transcribe audio (voice memos) using Whisper API
  app.post("/api/ai/transcribe", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { audioDataUrl, duration, step } = req.body;
      
      if (!audioDataUrl) {
        return res.status(400).json({ message: "audioDataUrl is required" });
      }

      const { transcribeAudio, summarizeVoiceMemo } = await import('./audio-transcription');
      
      const result = await transcribeAudio(audioDataUrl, duration || 0);
      
      let finalTranscription = result.transcription;
      if (result.status === 'success' && result.transcription) {
        finalTranscription = await summarizeVoiceMemo(result.transcription, step);
      }

      res.json({ 
        transcription: finalTranscription,
        rawTranscription: result.transcription,
        duration: result.duration,
        status: result.status,
        language: result.language,
        segments: result.segments,
      });

    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Parse Limitless transcript and extract knowledge
  app.post("/api/ai/parse-transcript", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { rawTranscript, title } = req.body;
      
      if (!rawTranscript || !title) {
        return res.status(400).json({ message: "rawTranscript and title are required" });
      }

      const result = await parseTranscript(rawTranscript, title);
      res.json(result);

    } catch (error) {
      console.error('Error parsing transcript:', error);
      res.status(500).json({ message: "Failed to parse transcript" });
    }
  });

  // ============================================================================
  // LIMITLESS TRANSCRIPT ROUTES - Eric Winn Recording Ingestion
  // ============================================================================

  // Get all transcripts
  app.get("/api/transcripts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const transcripts = await storage.getAllLimitlessTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
    }
  });

  // Get single transcript
  app.get("/api/transcripts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transcript ID" });
      }

      const transcript = await storage.getLimitlessTranscript(id);
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      res.json(transcript);
    } catch (error) {
      console.error('Error fetching transcript:', error);
      res.status(500).json({ message: "Failed to fetch transcript" });
    }
  });

  // Upload new transcript
  app.post("/api/transcripts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const transcriptData = insertLimitlessTranscriptSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });
      
      const transcript = await storage.createLimitlessTranscript(transcriptData);
      res.status(201).json(transcript);
    } catch (error) {
      console.error('Error creating transcript:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transcript data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  // Update transcript (e.g., after AI processing or review)
  app.patch("/api/transcripts/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transcript ID" });
      }

      const updatedTranscript = await storage.updateLimitlessTranscript(id, req.body);
      if (!updatedTranscript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      res.json(updatedTranscript);
    } catch (error) {
      console.error('Error updating transcript:', error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  // ============================================================================
  // LIMITLESS PENDANT SYNC ROUTES
  // ============================================================================

  // Check Limitless connection status
  app.get("/api/limitless/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const { getLimitlessClient } = await import('./limitless-client');
      const client = getLimitlessClient();
      
      if (!client) {
        return res.json({ 
          connected: false, 
          message: 'Limitless API key not configured. Add LIMITLESS_API_KEY to secrets.'
        });
      }

      const isConnected = await client.testConnection();
      res.json({ 
        connected: isConnected,
        message: isConnected ? 'Connected to Limitless Pendant' : 'Connection test failed'
      });
    } catch (error) {
      console.error('Error checking Limitless status:', error);
      res.status(500).json({ message: "Failed to check Limitless status" });
    }
  });

  // Fetch recent recordings from Limitless Pendant
  app.get("/api/limitless/recordings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const { getLimitlessClient, formatLifelogAsTranscript, extractDuration } = await import('./limitless-client');
      const client = getLimitlessClient();
      
      if (!client) {
        return res.status(400).json({ message: 'Limitless API key not configured' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const response = await client.getLifelogs({ 
        limit, 
        dateFrom, 
        dateTo,
        timezone: 'America/Chicago' 
      });

      const recordings = response.lifelogs.map(lifelog => ({
        id: lifelog.id,
        title: lifelog.title || `Recording ${lifelog.startTime}`,
        startTime: lifelog.startTime,
        endTime: lifelog.endTime,
        duration: extractDuration(lifelog),
        transcript: formatLifelogAsTranscript(lifelog),
        summary: lifelog.summary,
        actionItems: lifelog.actionItems || [],
      }));

      res.json({ recordings, total: response.total });
    } catch (error) {
      console.error('Error fetching Limitless recordings:', error);
      res.status(500).json({ message: "Failed to fetch recordings from Limitless" });
    }
  });

  // Import a Limitless recording as a transcript
  app.post("/api/limitless/import/:recordingId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const { getLimitlessClient, formatLifelogAsTranscript, extractDuration } = await import('./limitless-client');
      const client = getLimitlessClient();
      
      if (!client) {
        return res.status(400).json({ message: 'Limitless API key not configured' });
      }

      const recordingId = req.params.recordingId;
      
      const existingTranscripts = await storage.getAllLimitlessTranscripts();
      const alreadyImported = existingTranscripts.find(t => 
        t.uploadedBy === userId && 
        (t as any).externalId === recordingId
      );
      
      if (alreadyImported) {
        return res.status(409).json({ 
          message: 'Recording already imported',
          transcriptId: alreadyImported.id 
        });
      }

      const lifelog = await client.getLifelogById(recordingId);

      const transcript = await storage.createLimitlessTranscript({
        title: lifelog.title || `Recording ${lifelog.startTime}`,
        rawTranscript: formatLifelogAsTranscript(lifelog),
        duration: extractDuration(lifelog),
        recordingDate: new Date(lifelog.startTime),
        uploadedBy: userId,
      });

      res.status(201).json(transcript);
    } catch (error) {
      console.error('Error importing Limitless recording:', error);
      res.status(500).json({ message: "Failed to import recording" });
    }
  });

  // ============================================================================
  // COMPLIANCE & PROFICIENCY TRACKING ROUTES
  // ============================================================================

  // Get inspector progress and compliance data
  app.get("/api/compliance/progress", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      let progress = await storage.getInspectorProgress(userId);
      
      if (!progress) {
        progress = await storage.createInspectorProgress({ userId: userId });
      }

      res.json(progress);
    } catch (error) {
      console.error('Error fetching inspector progress:', error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Update proficiency after completing an inspection step
  app.post("/api/compliance/record-step", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const parseResult = recordStepPayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: parseResult.error.errors 
        });
      }
      
      const { step, timeSpentMinutes, aiInterventions, wasOverridden } = parseResult.data;

      let progress = await storage.getInspectorProgress(userId);
      if (!progress) {
        progress = await storage.createInspectorProgress({ userId: userId });
      }

      const currentProficiency = (progress.stepProficiency || {}) as Partial<Record<WinnMethodologyStep, StepProficiency>>;
      const stepData = currentProficiency[step] || {
        attemptCount: 0,
        averageTimeMinutes: 0,
        aiInterventionCount: 0,
        overrideCount: 0,
        lastAttempt: new Date().toISOString(),
        proficiencyLevel: 'novice' as const
      };

      const newAttemptCount = stepData.attemptCount + 1;
      const newAverageTime = ((stepData.averageTimeMinutes * stepData.attemptCount) + (timeSpentMinutes || 0)) / newAttemptCount;
      const newAiInterventions = stepData.aiInterventionCount + (aiInterventions || 0);
      const newOverrides = stepData.overrideCount + (wasOverridden ? 1 : 0);

      let proficiencyLevel: 'novice' | 'learning' | 'competent' | 'proficient' | 'expert' = 'novice';
      if (newAttemptCount >= 50 && newAiInterventions / newAttemptCount < 0.1) {
        proficiencyLevel = 'expert';
      } else if (newAttemptCount >= 25 && newAiInterventions / newAttemptCount < 0.2) {
        proficiencyLevel = 'proficient';
      } else if (newAttemptCount >= 10 && newAiInterventions / newAttemptCount < 0.3) {
        proficiencyLevel = 'competent';
      } else if (newAttemptCount >= 5) {
        proficiencyLevel = 'learning';
      }

      const updatedStepProficiency: Partial<Record<WinnMethodologyStep, StepProficiency>> = {
        ...currentProficiency,
        [step]: {
          attemptCount: newAttemptCount,
          averageTimeMinutes: Math.round(newAverageTime * 10) / 10,
          aiInterventionCount: newAiInterventions,
          overrideCount: newOverrides,
          lastAttempt: new Date().toISOString(),
          proficiencyLevel
        }
      };

      const updatedProgress = await storage.updateInspectorProgress(userId, {
        stepProficiency: updatedStepProficiency as Record<WinnMethodologyStep, StepProficiency>
      });

      res.json({
        step,
        proficiency: updatedStepProficiency[step],
        overallProgress: updatedProgress
      });
    } catch (error) {
      console.error('Error recording step proficiency:', error);
      res.status(500).json({ message: "Failed to record step" });
    }
  });

  // Record an override (when step is skipped)
  app.post("/api/compliance/record-override", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const parseResult = recordOverridePayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: parseResult.error.errors 
        });
      }
      
      const { sessionId, step, reason } = parseResult.data;
      const sessionIdNum = parseInt(sessionId, 10);
      
      if (isNaN(sessionIdNum) || sessionIdNum <= 0) {
        return res.status(400).json({ message: "Invalid session ID format" });
      }

      const session = await storage.getInspectionSession(sessionIdNum);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const currentOverrides = session.overrides || [];
      const newOverride: StepOverride = {
        step,
        reason,
        timestamp: new Date().toISOString()
      };

      const updatedSession = await storage.updateInspectionSession(sessionIdNum, {
        overrides: [...currentOverrides, newOverride]
      });

      let progress = await storage.getInspectorProgress(userId);
      if (progress) {
        const currentProficiency = (progress.stepProficiency || {}) as Partial<Record<WinnMethodologyStep, StepProficiency>>;
        const stepData = currentProficiency[step] || {
          attemptCount: 0,
          averageTimeMinutes: 0,
          aiInterventionCount: 0,
          overrideCount: 0,
          lastAttempt: new Date().toISOString(),
          proficiencyLevel: 'novice' as const
        };

        const updatedStepProficiency: Partial<Record<WinnMethodologyStep, StepProficiency>> = {
          ...currentProficiency,
          [step]: {
            ...stepData,
            overrideCount: stepData.overrideCount + 1,
            lastAttempt: new Date().toISOString()
          }
        };

        await storage.updateInspectorProgress(userId, {
          stepProficiency: updatedStepProficiency as Record<WinnMethodologyStep, StepProficiency>
        });
      }

      res.json({
        override: newOverride,
        session: updatedSession
      });
    } catch (error) {
      console.error('Error recording override:', error);
      res.status(500).json({ message: "Failed to record override" });
    }
  });

  // Get training recommendations based on performance gaps
  app.get("/api/compliance/recommendations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getAuthenticatedUserId(req, res);
      if (!userId) return;

      const progress = await storage.getInspectorProgress(userId);
      
      const recommendations: {
        step: WinnMethodologyStep;
        issue: string;
        recommendation: string;
        priority: 'high' | 'medium' | 'low';
      }[] = [];

      if (progress?.stepProficiency) {
        for (const step of WINN_METHODOLOGY_STEPS) {
          const proficiency = progress.stepProficiency[step];
          if (!proficiency) continue;

          if (proficiency.overrideCount > 2 && proficiency.attemptCount > 0) {
            const overrideRate = proficiency.overrideCount / proficiency.attemptCount;
            if (overrideRate > 0.3) {
              recommendations.push({
                step,
                issue: `High skip rate (${Math.round(overrideRate * 100)}%)`,
                recommendation: `Review training materials for ${step.replace(/_/g, ' ')} step`,
                priority: 'high'
              });
            }
          }

          if (proficiency.aiInterventionCount > 5 && proficiency.attemptCount > 0) {
            const interventionRate = proficiency.aiInterventionCount / proficiency.attemptCount;
            if (interventionRate > 0.5) {
              recommendations.push({
                step,
                issue: `Frequent AI assistance needed (${Math.round(interventionRate * 100)}%)`,
                recommendation: `Complete additional practice sessions for ${step.replace(/_/g, ' ')}`,
                priority: 'medium'
              });
            }
          }

          if (proficiency.proficiencyLevel === 'novice' && proficiency.attemptCount > 3) {
            recommendations.push({
              step,
              issue: 'Still at novice level after multiple attempts',
              recommendation: `Schedule a mentoring session for ${step.replace(/_/g, ' ')}`,
              priority: 'high'
            });
          }
        }
      }

      for (const step of WINN_METHODOLOGY_STEPS) {
        const proficiency = progress?.stepProficiency?.[step];
        if (!proficiency || proficiency.attemptCount === 0) {
          recommendations.push({
            step,
            issue: 'No experience with this step',
            recommendation: `Start training for ${step.replace(/_/g, ' ')} step`,
            priority: 'low'
          });
        }
      }

      res.json({
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        overallComplianceScore: progress?.averageComplianceScore || 0,
        totalInspections: progress?.totalInspections || 0
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // ==========================================
  // STORMY AI ROUTES - Multi-modal AI Assistant
  // ==========================================
  
  const stormyService = await import('./stormy-ai-service');

  // Get user's conversations
  app.get("/api/stormy/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const conversations = await stormyService.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get specific conversation with messages
  app.get("/api/stormy/conversations/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await stormyService.getConversationHistory(conversationId);
      const conversation = await storage.getAIConversation(conversationId);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Send message to Stormy
  app.post("/api/stormy/message", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { message, conversationId, attachments, propertyId, inspectionId, contextType } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const result = await stormyService.sendMessage({
        userId,
        message,
        conversationId,
        attachments,
        propertyId,
        inspectionId,
        contextType
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error sending message to Stormy:', error);
      res.status(500).json({ message: error.message || "Failed to get response from Stormy" });
    }
  });

  // Analyze image directly
  app.post("/api/stormy/analyze-image", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { imageUrl, imageType, additionalContext } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      const result = await stormyService.analyzeImage(
        userId,
        imageUrl,
        imageType || 'general',
        additionalContext
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ message: error.message || "Failed to analyze image" });
    }
  });

  // Get or create conversation for context
  app.post("/api/stormy/conversations", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { propertyId, inspectionId, contextType } = req.body;
      
      const conversation = await stormyService.getOrCreateConversation(
        userId,
        propertyId,
        inspectionId,
        contextType || 'general'
      );

      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get user's AI memory/preferences
  app.get("/api/stormy/memory", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const memory = await stormyService.getUserMemory(userId);
      res.json(memory || { preferences: {} });
    } catch (error) {
      console.error('Error fetching memory:', error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  // Update user's AI preferences
  app.patch("/api/stormy/memory", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { preferences, summary } = req.body;
      const memory = await stormyService.updateUserMemory(userId, preferences || {}, summary);
      res.json(memory);
    } catch (error) {
      console.error('Error updating memory:', error);
      res.status(500).json({ message: "Failed to update memory" });
    }
  });

  // ==========================================
  // STORMY VOICE ROUTES - Hands-free Voice Chat
  // ==========================================

  const voiceService = await import('./voice-service');

  // Text-to-speech for Stormy responses
  app.post("/api/stormy/voice/speak", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required" });
      }

      const audioBuffer = await voiceService.speakStormyResponse(text);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error('Error generating speech:', error);
      res.status(500).json({ message: error.message || "Failed to generate speech" });
    }
  });

  // Speech-to-text for voice input
  app.post("/api/stormy/voice/transcribe", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.body || !Buffer.isBuffer(req.body)) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      const result = await voiceService.speechToText(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ message: error.message || "Failed to transcribe audio" });
    }
  });

  // Full voice conversation - transcribe, process with Stormy, and return audio response
  const voiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  
  app.post("/api/stormy/voice/chat", requireAuth, voiceUpload.single('audio'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const contentType = req.headers['content-type'] || '';
      let audioBuffer: Buffer;
      let conversationId: number | undefined;
      let imageUrl: string | undefined;
      
      if (contentType.includes('multipart/form-data')) {
        if (!req.file) {
          return res.status(400).json({ message: "Audio file is required" });
        }
        audioBuffer = req.file.buffer;
        conversationId = req.body.conversationId ? parseInt(req.body.conversationId) : undefined;
        imageUrl = req.body.imageUrl;
      } else {
        conversationId = req.query.conversationId ? parseInt(req.query.conversationId as string) : undefined;
        imageUrl = req.query.imageUrl as string | undefined;

        if (!req.body || req.body.length === 0) {
          return res.status(400).json({ message: "Audio data is required" });
        }
        audioBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
      }

      const result = await voiceService.processVoiceMessage(
        audioBuffer,
        userId,
        conversationId,
        imageUrl
      );

      res.json({
        transcription: result.transcription,
        response: result.response,
        audio: result.audioBuffer ? result.audioBuffer.toString('base64') : null,
      });
    } catch (error: any) {
      console.error('Error processing voice chat:', error);
      res.status(500).json({ message: error.message || "Failed to process voice chat" });
    }
  });

  // Get Stormy's greeting audio
  app.get("/api/stormy/voice/greeting", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const audioBuffer = await voiceService.generateStormyGreeting();

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error('Error generating greeting:', error);
      res.status(500).json({ message: error.message || "Failed to generate greeting" });
    }
  });

  return httpServer;
}
