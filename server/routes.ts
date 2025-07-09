import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPropertySchema, insertScanSchema, insertReportSchema } from "@shared/schema";
import { analyzeThermalImage, generateThermalReport } from "./thermal-analysis";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  // Note: Most authentication is handled via Firebase on the client-side
  // These endpoints are for server session management

  // User routes
  app.get("/api/user", async (req, res) => {
    // Would normally verify the user's session/token here
    // For MVP, we're using a demo user
    const demoUser = await storage.getUserByEmail("demo@example.com");
    if (!demoUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password in response
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
      // Get demo user for MVP
      const demoUser = await storage.getUserByEmail("demo@example.com");
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
        error: error.message 
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
        error: error.message 
      });
    }
  });

  return httpServer;
}
