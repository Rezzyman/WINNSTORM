import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPropertySchema, insertReportSchema, insertScanSchema, insertCrmConfigSchema, insertCrmSyncLogSchema } from "@shared/schema";
import { analyzeThermalImage, generateThermalReport } from "./thermal-analysis";
import { crmManager } from './crm-integrations';
import { getAIAssistance, analyzeInspectionData, AIAssistantRequest } from './ai-assistant';
import { requireAuth } from './auth';
import Stripe from 'stripe';

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

  return httpServer;
}
