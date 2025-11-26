import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPropertySchema, insertReportSchema, insertScanSchema, insertCrmConfigSchema, insertCrmSyncLogSchema, insertKnowledgeBaseSchema,
  insertInspectionSessionSchema, insertEvidenceAssetSchema, insertLimitlessTranscriptSchema,
  WINN_METHODOLOGY_STEPS, WinnMethodologyStep, StepRequirements, AIStepValidation
} from "@shared/schema";
import { analyzeThermalImage, generateThermalReport } from "./thermal-analysis";
import { crmManager } from './crm-integrations';
import { getAIAssistance, analyzeInspectionData, AIAssistantRequest, analyzeInspectionImage, getStepCoaching, parseTranscript, ImageAnalysisRequest } from './ai-assistant';
import { requireAuth } from './auth';
import Stripe from 'stripe';

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
  app.get("/api/user", async (req, res) => {
    if (!requireAuth(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const demoUser = await storage.getUserByEmail("demo@example.com");
    if (!demoUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = demoUser;
    res.json(userWithoutPassword);
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    // Would normally get user ID from authenticated session
    const demoUser = await storage.getUserByEmail("demo@example.com");
    if (!demoUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const properties = await storage.getPropertiesByUser(demoUser.id);
    res.json(properties);
  });

  app.get("/api/properties/:id", async (req, res) => {
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

  app.post("/api/properties", async (req, res) => {
    try {
      // Get demo user for MVP - try both demo and test user emails
      let demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        demoUser = await storage.getUserByEmail("test@example.com");
      }
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Extract and validate relevant fields
      const { name, address, imageUrls, scanType, notes, captureDate } = req.body;
      
      // Validate property data
      const propertyData = insertPropertySchema.parse({
        name,
        address,
        imageUrl: imageUrls[0], // Use the first image as property image
        userId: demoUser.id
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
        userId: demoUser.id
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

  // Scan routes
  app.get("/api/scans/:id", async (req, res) => {
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

  app.get("/api/properties/:id/scans", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    
    const scans = await storage.getScansByProperty(id);
    res.json(scans);
  });

  // Report routes
  app.post("/api/reports/send/:scanId", async (req, res) => {
    try {
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
      
      // Get demo user for MVP
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Create a report
      const reportData = insertReportSchema.parse({
        scanId,
        title: "Thermal Roof Assessment",
        pdfUrl: "", // In MVP, we don't actually generate a PDF
        sentTo: email,
        userId: demoUser.id
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

  app.get("/api/reports/download/:scanId", async (req, res) => {
    try {
      const scanId = parseInt(req.params.scanId);
      if (isNaN(scanId)) {
        return res.status(400).json({ message: "Invalid scan ID" });
      }
      
      // Get the scan
      const scan = await storage.getScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      // Get the property
      const property = await storage.getProperty(scan.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get demo user for MVP
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // In a real implementation, you would generate and return a PDF here
      
      // Instead, for the MVP, we just return success
      res.json({
        message: "Report downloaded successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // CRM Configuration routes
  app.get("/api/crm/configs", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const configs = await storage.getCrmConfigsByUser(demoUser.id);
      res.json(configs);
    } catch (error) {
      console.error('Error fetching CRM configs:', error);
      res.status(500).json({ message: "Failed to fetch CRM configurations" });
    }
  });

  app.post("/api/crm/configs", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const configData = insertCrmConfigSchema.parse(req.body);
      const config = await storage.createCrmConfig({
        ...configData,
        userId: demoUser.id
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

  app.put("/api/crm/configs/:id", async (req, res) => {
    try {
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

  app.delete("/api/crm/configs/:id", async (req, res) => {
    try {
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
  app.post("/api/crm/sync/property", async (req, res) => {
    try {
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

  app.get("/api/crm/sync/logs/:configId", async (req, res) => {
    try {
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

  // Thermal Analysis API routes
  app.post("/api/thermal/analyze", async (req, res) => {
    try {
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

  app.post("/api/thermal/generate-report", async (req, res) => {
    try {
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
  app.post("/api/ai-assistant", async (req, res) => {
    try {
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

  app.post("/api/ai-assistant/analyze-inspection", async (req, res) => {
    try {
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
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-10-29.clover',
      });

      const { plan } = req.body;

      // Map plan names to Stripe price IDs
      // You'll need to create these products in your Stripe Dashboard
      const priceMap: Record<string, string> = {
        'starter': process.env.STRIPE_PRICE_STARTER || '',
        'professional': process.env.STRIPE_PRICE_PROFESSIONAL || '',
        'enterprise': process.env.STRIPE_PRICE_ENTERPRISE || ''
      };

      const priceId = priceMap[plan.toLowerCase()];
      
      if (!priceId) {
        // For development, create a subscription without a specific price
        // In production, you should have actual price IDs from Stripe
        console.warn(`No Stripe price ID configured for plan: ${plan}. Using demo mode.`);
      }

      // Create a customer (in production, check if customer already exists)
      const customer = await stripe.customers.create({
        metadata: {
          plan: plan,
        },
      });

      // Create a subscription with payment intent
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: priceId ? [{ price: priceId }] : [],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

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
  app.get("/api/knowledge", async (req, res) => {
    try {
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

  app.get("/api/knowledge/:id", async (req, res) => {
    try {
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

  app.post("/api/knowledge", async (req, res) => {
    try {
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

  app.patch("/api/knowledge/:id", async (req, res) => {
    try {
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

  app.delete("/api/knowledge/:id", async (req, res) => {
    try {
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

  // Get or create active inspection session for a property
  app.get("/api/inspection/session/active", async (req, res) => {
    try {
      const propertyId = parseInt(req.query.propertyId as string);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      // Get demo user for MVP
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let session = await storage.getActiveInspectionSession(propertyId, demoUser.id);
      
      if (!session) {
        // Create new session
        session = await storage.createInspectionSession({
          propertyId,
          inspectorId: demoUser.id,
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
  app.get("/api/inspection/session/:id", async (req, res) => {
    try {
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
  app.get("/api/inspection/sessions", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessions = await storage.getInspectionSessionsByInspector(demoUser.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching inspection sessions:', error);
      res.status(500).json({ message: "Failed to fetch inspection sessions" });
    }
  });

  // Create new inspection session
  app.post("/api/inspection/session", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      if (!demoUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessionData = insertInspectionSessionSchema.parse({
        ...req.body,
        inspectorId: demoUser.id,
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
  app.patch("/api/inspection/session/:id", async (req, res) => {
    try {
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
  app.post("/api/inspection/session/:id/advance", async (req, res) => {
    try {
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
  app.post("/api/inspection/session/:id/skip", async (req, res) => {
    try {
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
  app.post("/api/inspection/session/:id/complete", async (req, res) => {
    try {
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
  app.get("/api/inspection/session/:sessionId/evidence", async (req, res) => {
    try {
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
  app.post("/api/inspection/evidence", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      
      const assetData = insertEvidenceAssetSchema.parse({
        ...req.body,
        uploadedBy: demoUser?.id,
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
  app.patch("/api/inspection/evidence/:id", async (req, res) => {
    try {
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
  app.delete("/api/inspection/evidence/:id", async (req, res) => {
    try {
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
  // MULTIMODAL AI ANALYSIS ROUTES - GPT-5.1 Vision & Coaching
  // ============================================================================

  // Analyze an image using GPT-5.1 vision
  app.post("/api/ai/analyze-image", async (req, res) => {
    try {
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
  app.post("/api/inspection/evidence/:id/analyze", async (req, res) => {
    try {
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
  app.get("/api/ai/coaching/:step", async (req, res) => {
    try {
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

  // Parse Limitless transcript and extract knowledge
  app.post("/api/ai/parse-transcript", async (req, res) => {
    try {
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
  app.get("/api/transcripts", async (req, res) => {
    try {
      const transcripts = await storage.getAllLimitlessTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
    }
  });

  // Get single transcript
  app.get("/api/transcripts/:id", async (req, res) => {
    try {
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
  app.post("/api/transcripts", async (req, res) => {
    try {
      const demoUser = await storage.getUserByEmail("demo@example.com");
      
      const transcriptData = insertLimitlessTranscriptSchema.parse({
        ...req.body,
        uploadedBy: demoUser?.id,
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
  app.patch("/api/transcripts/:id", async (req, res) => {
    try {
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

  return httpServer;
}
