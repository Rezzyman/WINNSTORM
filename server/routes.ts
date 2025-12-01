import type { Express, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPropertySchema, insertReportSchema, insertScanSchema, insertCrmConfigSchema, insertCrmSyncLogSchema, insertKnowledgeBaseSchema,
  insertInspectionSessionSchema, insertEvidenceAssetSchema, insertLimitlessTranscriptSchema,
  WINN_METHODOLOGY_STEPS, WinnMethodologyStep, StepRequirements, AIStepValidation, StepOverride,
  recordStepPayloadSchema, recordOverridePayloadSchema
} from "@shared/schema";
import { analyzeThermalImage, generateThermalReport } from "./thermal-analysis";
import { crmManager } from './crm-integrations';
import { getAIAssistance, analyzeInspectionData, AIAssistantRequest, analyzeInspectionImage, getStepCoaching, parseTranscript, ImageAnalysisRequest } from './ai-assistant';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './auth';
import Stripe from 'stripe';

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
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      let paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;

      // If no payment intent exists on the invoice, we need to finalize it to create one
      if (!paymentIntent && invoice?.id) {
        try {
          const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            expand: ['payment_intent'],
          });
          paymentIntent = finalizedInvoice.payment_intent as Stripe.PaymentIntent | null;
        } catch (finalizeError) {
          console.error('Error finalizing invoice:', finalizeError);
        }
      }

      if (!paymentIntent?.client_secret) {
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
        currentStep: currentStep,
        experienceLevel: experienceLevel || 'intermediate',
        question: message,
      });

      res.json({ 
        response: aiResponse.response,
        suggestedActions: aiResponse.suggestedActions || []
      });

    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ message: "Failed to get AI response" });
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

      const currentProficiency = progress.stepProficiency || {};
      const stepData = currentProficiency[step as WinnMethodologyStep] || {
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

      const updatedStepProficiency = {
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
        stepProficiency: updatedStepProficiency
      });

      res.json({
        step,
        proficiency: updatedStepProficiency[step as WinnMethodologyStep],
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

      const session = await storage.getInspectionSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const currentOverrides = session.overrides || [];
      const newOverride: StepOverride = {
        step,
        reason,
        timestamp: new Date().toISOString()
      };

      const updatedSession = await storage.updateInspectionSession(sessionId, {
        overrides: [...currentOverrides, newOverride]
      });

      let progress = await storage.getInspectorProgress(userId);
      if (progress) {
        const currentProficiency = progress.stepProficiency || {};
        const stepData = currentProficiency[step as WinnMethodologyStep] || {
          attemptCount: 0,
          averageTimeMinutes: 0,
          aiInterventionCount: 0,
          overrideCount: 0,
          lastAttempt: new Date().toISOString(),
          proficiencyLevel: 'novice' as const
        };

        const updatedStepProficiency = {
          ...currentProficiency,
          [step]: {
            ...stepData,
            overrideCount: stepData.overrideCount + 1,
            lastAttempt: new Date().toISOString()
          }
        };

        await storage.updateInspectorProgress(userId, {
          stepProficiency: updatedStepProficiency
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

  return httpServer;
}
