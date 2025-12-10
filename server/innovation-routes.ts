import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  predictiveClaimEngine,
  fieldCopilotService,
  iotSensorService,
  droneIntegrationService,
  carrierConsoleService,
  contractorMarketplaceService,
  riskIntelligenceService,
  innovationModuleService,
} from "./innovation-services";
import {
  insertClaimOutcomeSchema,
  insertFieldCopilotSessionSchema,
  insertWearableDeviceSchema,
  insertIotDeviceSchema,
  insertSensorReadingSchema,
  insertDronePilotSchema,
  insertDroneAssetSchema,
  insertFlightSessionSchema,
  insertCarrierAccountSchema,
  insertCarrierUserSchema,
  insertCarrierClaimSubmissionSchema,
  insertContractorProfileSchema,
  insertRepairJobSchema,
  insertContractorBidSchema,
  insertReferralFeeSchema,
  insertRiskRegionSchema,
  insertRiskDataExportSchema,
} from "@shared/schema";

const router = Router();

// Validation helper
function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { success: false, error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
  }
  return { success: true, data: result.data };
}

// ============================================================================
// INNOVATION MODULE MANAGEMENT
// ============================================================================

router.get("/modules", async (req: Request, res: Response) => {
  try {
    const modules = await innovationModuleService.getAvailableModules();
    res.json(modules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/modules/:code", async (req: Request, res: Response) => {
  try {
    const module = await innovationModuleService.getModuleByCode(req.params.code);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json(module);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/modules/seed", async (req: Request, res: Response) => {
  try {
    await innovationModuleService.seedDefaultModules();
    res.json({ message: "Default modules seeded successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/modules/:moduleId/enable", async (req: Request, res: Response) => {
  try {
    const { orgId, enabledBy } = req.body;
    const result = await innovationModuleService.enableModuleForOrg(
      orgId,
      parseInt(req.params.moduleId),
      enabledBy
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PREDICTIVE CLAIM OUTCOME ENGINE
// ============================================================================

router.post("/claims/outcomes", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertClaimOutcomeSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const outcome = await predictiveClaimEngine.recordClaimOutcome(validation.data);
    res.json(outcome);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/claims/outcomes", async (req: Request, res: Response) => {
  try {
    const { insurerName, claimType } = req.query;
    const outcomes = await predictiveClaimEngine.getClaimOutcomes({
      insurerName: insurerName as string,
      claimType: claimType as string,
    });
    res.json(outcomes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/claims/predict", async (req: Request, res: Response) => {
  try {
    const { projectId, insurerName, claimData } = req.body;
    const prediction = await predictiveClaimEngine.predictClaimOutcome(
      projectId,
      insurerName,
      claimData
    );
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/claims/predictions/:projectId", async (req: Request, res: Response) => {
  try {
    const predictions = await predictiveClaimEngine.getPredictionHistory(
      parseInt(req.params.projectId)
    );
    res.json(predictions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/claims/insurer-patterns", async (req: Request, res: Response) => {
  try {
    const { insurerName } = req.query;
    const patterns = await predictiveClaimEngine.getInsurerPatterns(
      insurerName as string
    );
    res.json(patterns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STORMY FIELD CO-PILOT
// ============================================================================

router.post("/copilot/sessions", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertFieldCopilotSessionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const session = await fieldCopilotService.startSession(validation.data);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/copilot/sessions/active/:userId", async (req: Request, res: Response) => {
  try {
    const session = await fieldCopilotService.getActiveSession(req.params.userId);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/copilot/sessions/:sessionId/end", async (req: Request, res: Response) => {
  try {
    const session = await fieldCopilotService.endSession(parseInt(req.params.sessionId));
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/copilot/guidance", async (req: Request, res: Response) => {
  try {
    const { sessionId, visualContext, currentStep } = req.body;
    const guidance = await fieldCopilotService.getGuidanceForContext(
      sessionId,
      visualContext,
      currentStep
    );
    res.json(guidance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/copilot/wearables", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertWearableDeviceSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const device = await fieldCopilotService.registerWearableDevice(validation.data);
    res.json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/copilot/wearables/:userId", async (req: Request, res: Response) => {
  try {
    const devices = await fieldCopilotService.getUserWearables(req.params.userId);
    res.json(devices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SMART SENSOR NETWORK (IoT)
// ============================================================================

router.post("/iot/devices", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertIotDeviceSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const device = await iotSensorService.registerDevice(validation.data);
    res.json(device);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/iot/devices/property/:propertyId", async (req: Request, res: Response) => {
  try {
    const devices = await iotSensorService.getPropertyDevices(
      parseInt(req.params.propertyId)
    );
    res.json(devices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/iot/readings", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertSensorReadingSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const reading = await iotSensorService.recordReading(validation.data);
    res.json(reading);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/iot/readings/:deviceId", async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const readings = await iotSensorService.getDeviceReadings(
      parseInt(req.params.deviceId),
      hours
    );
    res.json(readings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/iot/alerts", async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId 
      ? parseInt(req.query.propertyId as string) 
      : undefined;
    const alerts = await iotSensorService.getUnacknowledgedAlerts(propertyId);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/iot/alerts/:alertId/acknowledge", async (req: Request, res: Response) => {
  try {
    const { acknowledgedBy } = req.body;
    const alert = await iotSensorService.acknowledgeAlert(
      parseInt(req.params.alertId),
      acknowledgedBy
    );
    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DRONE INTEGRATION
// ============================================================================

router.post("/drones/pilots", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertDronePilotSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const pilot = await droneIntegrationService.registerPilot(validation.data);
    res.json(pilot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/drones/assets", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertDroneAssetSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const drone = await droneIntegrationService.registerDrone(validation.data);
    res.json(drone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/drones/assets/available", async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId 
      ? parseInt(req.query.ownerId as string) 
      : undefined;
    const drones = await droneIntegrationService.getAvailableDrones(ownerId);
    res.json(drones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/drones/flights", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertFlightSessionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const session = await droneIntegrationService.planFlightSession(validation.data);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/drones/flights/:sessionId/start", async (req: Request, res: Response) => {
  try {
    const session = await droneIntegrationService.startFlight(
      parseInt(req.params.sessionId)
    );
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/drones/flights/:sessionId/complete", async (req: Request, res: Response) => {
  try {
    const session = await droneIntegrationService.completeFlight(
      parseInt(req.params.sessionId),
      req.body
    );
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/drones/flights", async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId 
      ? parseInt(req.query.propertyId as string) 
      : undefined;
    const pilotId = req.query.pilotId 
      ? parseInt(req.query.pilotId as string) 
      : undefined;
    const flights = await droneIntegrationService.getFlightHistory(propertyId, pilotId);
    res.json(flights);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INSURANCE CARRIER CONSOLE
// ============================================================================

router.post("/carriers", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertCarrierAccountSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const carrier = await carrierConsoleService.createCarrierAccount(validation.data);
    res.json(carrier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/carriers/users", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertCarrierUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const user = await carrierConsoleService.addCarrierUser(validation.data);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/carriers/submissions", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertCarrierClaimSubmissionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const submission = await carrierConsoleService.submitClaimToCarrier(validation.data);
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/carriers/:carrierId/submissions", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const submissions = await carrierConsoleService.getCarrierSubmissions(
      parseInt(req.params.carrierId),
      status
    );
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/carriers/submissions/:submissionId", async (req: Request, res: Response) => {
  try {
    const { status, decision, approvedAmount } = req.body;
    const submission = await carrierConsoleService.updateSubmissionStatus(
      parseInt(req.params.submissionId),
      status,
      decision,
      approvedAmount
    );
    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/carriers/ai-summary", async (req: Request, res: Response) => {
  try {
    const summary = await carrierConsoleService.generateAISummary(req.body.projectData);
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CONTRACTOR MARKETPLACE
// ============================================================================

router.post("/contractors", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertContractorProfileSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const profile = await contractorMarketplaceService.createContractorProfile(validation.data);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contractors/search", async (req: Request, res: Response) => {
  try {
    const { specialties, serviceArea, minRating } = req.query;
    const contractors = await contractorMarketplaceService.searchContractors({
      specialties: specialties ? (specialties as string).split(',') : undefined,
      serviceArea: serviceArea as string,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
    });
    res.json(contractors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/contractors/jobs", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertRepairJobSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const job = await contractorMarketplaceService.createRepairJob(validation.data);
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contractors/jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await contractorMarketplaceService.getOpenJobs();
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/contractors/bids", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertContractorBidSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const bid = await contractorMarketplaceService.submitBid(validation.data);
    res.json(bid);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contractors/jobs/:jobId/bids", async (req: Request, res: Response) => {
  try {
    const bids = await contractorMarketplaceService.getJobBids(
      parseInt(req.params.jobId)
    );
    res.json(bids);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/contractors/bids/:bidId/accept", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    await contractorMarketplaceService.acceptBid(
      parseInt(req.params.bidId),
      jobId
    );
    res.json({ message: "Bid accepted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/contractors/referrals", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertReferralFeeSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const fee = await contractorMarketplaceService.recordReferralFee(validation.data);
    res.json(fee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REGIONAL RISK INTELLIGENCE
// ============================================================================

router.post("/risk/regions", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertRiskRegionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const region = await riskIntelligenceService.createRegion(validation.data);
    res.json(region);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/risk/regions", async (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    const regions = await riskIntelligenceService.getRegions(state);
    res.json(regions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/risk/assessments", async (req: Request, res: Response) => {
  try {
    const { regionId, periodStart, periodEnd } = req.body;
    const assessment = await riskIntelligenceService.calculateRiskAssessment(
      regionId,
      new Date(periodStart),
      new Date(periodEnd)
    );
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/risk/assessments/:regionId", async (req: Request, res: Response) => {
  try {
    const assessments = await riskIntelligenceService.getRegionRiskAssessments(
      parseInt(req.params.regionId)
    );
    res.json(assessments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/risk/exports", async (req: Request, res: Response) => {
  try {
    const validation = validateBody(insertRiskDataExportSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }
    const exportRecord = await riskIntelligenceService.createDataExport(validation.data);
    res.json(exportRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/risk/exports/:carrierId", async (req: Request, res: Response) => {
  try {
    const exports = await riskIntelligenceService.getCarrierExports(
      parseInt(req.params.carrierId)
    );
    res.json(exports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
