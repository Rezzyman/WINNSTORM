import OpenAI from "openai";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
  claimOutcomes,
  claimPredictions,
  insurerPatterns,
  fieldCopilotSessions,
  copilotGuidanceEvents,
  wearableDevices,
  iotDevices,
  sensorReadings,
  sensorAlerts,
  dronePilots,
  droneAssets,
  flightSessions,
  carrierAccounts,
  carrierUsers,
  carrierClaimSubmissions,
  contractorProfiles,
  repairJobs,
  contractorBids,
  referralFees,
  riskRegions,
  riskAssessments,
  riskDataExports,
  innovationModules,
  organizationModules,
  InsertClaimOutcome,
  InsertClaimPrediction,
  InsertInsurerPattern,
  InsertFieldCopilotSession,
  InsertCopilotGuidanceEvent,
  InsertWearableDeviceRecord,
  InsertIotDevice,
  InsertSensorReading,
  InsertSensorAlert,
  InsertDronePilot,
  InsertDroneAsset,
  InsertFlightSession,
  InsertCarrierAccount,
  InsertCarrierUser,
  InsertCarrierClaimSubmission,
  InsertContractorProfile,
  InsertRepairJob,
  InsertContractorBid,
  InsertReferralFee,
  InsertRiskRegion,
  InsertRiskAssessment,
  InsertRiskDataExport,
  InsertInnovationModule,
  InsertOrganizationModule,
  ClaimOutcomeFactors,
  PredictionConfidence,
} from "@shared/schema";

const openai = new OpenAI();

// ============================================================================
// 1. PREDICTIVE CLAIM OUTCOME ENGINE
// ============================================================================

export class PredictiveClaimEngine {
  
  async recordClaimOutcome(data: InsertClaimOutcome) {
    const [outcome] = await db.insert(claimOutcomes).values(data).returning();
    await this.updateInsurerPatterns(data.insurerName);
    return outcome;
  }

  async getClaimOutcomes(filters?: { insurerName?: string; claimType?: string }) {
    const conditions = [];
    if (filters?.insurerName) {
      conditions.push(eq(claimOutcomes.insurerName, filters.insurerName));
    }
    if (filters?.claimType) {
      conditions.push(eq(claimOutcomes.claimType, filters.claimType));
    }
    
    if (conditions.length > 0) {
      return db.select().from(claimOutcomes)
        .where(and(...conditions))
        .orderBy(desc(claimOutcomes.createdAt));
    }
    return db.select().from(claimOutcomes).orderBy(desc(claimOutcomes.createdAt));
  }

  async predictClaimOutcome(projectId: number, insurerName: string, claimData: any) {
    const patterns = await db.select().from(insurerPatterns)
      .where(eq(insurerPatterns.insurerName, insurerName));
    
    const historicalOutcomes = await db.select().from(claimOutcomes)
      .where(eq(claimOutcomes.insurerName, insurerName))
      .limit(100);

    const prompt = `You are an expert insurance claims analyst. Based on the following data, predict the claim outcome.

Insurer: ${insurerName}
Insurer Historical Patterns: ${JSON.stringify(patterns[0] || {})}
Similar Historical Claims: ${historicalOutcomes.length} cases analyzed
Claim Data: ${JSON.stringify(claimData)}

Provide your prediction in JSON format:
{
  "predictedOutcome": "approved" | "denied" | "partial",
  "confidenceScore": 0-1,
  "predictedAmount": number or null,
  "predictedDaysToResolution": number,
  "recommendations": ["action1", "action2"],
  "riskFactors": ["risk1", "risk2"],
  "strengthFactors": ["strength1", "strength2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const prediction = JSON.parse(response.choices[0].message.content || "{}");
      
      const confidence: PredictionConfidence = {
        overall: prediction.confidenceScore || 0.5,
        dataQuality: historicalOutcomes.length > 50 ? 'high' : historicalOutcomes.length > 10 ? 'medium' : 'low',
        factorsConsidered: Object.keys(claimData).length,
        similarCasesAnalyzed: historicalOutcomes.length,
      };

      const [savedPrediction] = await db.insert(claimPredictions).values({
        projectId,
        predictedOutcome: prediction.predictedOutcome || 'unknown',
        confidenceScore: prediction.confidenceScore || 0.5,
        confidence,
        predictedAmount: prediction.predictedAmount,
        predictedDaysToResolution: prediction.predictedDaysToResolution,
        recommendations: prediction.recommendations || [],
        riskFactors: prediction.riskFactors || [],
        strengthFactors: prediction.strengthFactors || [],
        modelVersion: 'gpt-4o-v1',
      }).returning();

      return savedPrediction;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  async updateInsurerPatterns(insurerName: string) {
    const outcomes = await db.select().from(claimOutcomes)
      .where(eq(claimOutcomes.insurerName, insurerName));

    if (outcomes.length < 5) return;

    const approved = outcomes.filter(o => o.outcome === 'approved');
    const avgApprovalRate = approved.length / outcomes.length;
    const avgDays = outcomes.reduce((sum, o) => sum + (o.daysToResolution || 0), 0) / outcomes.length;
    const avgPayout = approved.reduce((sum, o) => {
      if (o.approvedAmount && o.claimAmount) {
        return sum + (o.approvedAmount / o.claimAmount);
      }
      return sum;
    }, 0) / (approved.length || 1);

    const denialReasons = outcomes
      .filter(o => o.outcome === 'denied' && o.notes)
      .map(o => o.notes!)
      .slice(0, 10);

    await db.insert(insurerPatterns).values({
      insurerName,
      avgApprovalRate,
      avgDaysToDecision: avgDays,
      avgPayoutPercentage: avgPayout,
      commonDenialReasons: denialReasons,
      claimVolume: outcomes.length,
      dataQuality: outcomes.length > 50 ? 'high' : outcomes.length > 20 ? 'medium' : 'low',
    }).onConflictDoUpdate({
      target: insurerPatterns.insurerName,
      set: {
        avgApprovalRate,
        avgDaysToDecision: avgDays,
        avgPayoutPercentage: avgPayout,
        commonDenialReasons: denialReasons,
        claimVolume: outcomes.length,
        lastUpdated: new Date(),
      },
    });
  }

  async getInsurerPatterns(insurerName?: string) {
    if (insurerName) {
      return db.select().from(insurerPatterns)
        .where(eq(insurerPatterns.insurerName, insurerName));
    }
    return db.select().from(insurerPatterns).orderBy(desc(insurerPatterns.claimVolume));
  }

  async getPredictionHistory(projectId: number) {
    return db.select().from(claimPredictions)
      .where(eq(claimPredictions.projectId, projectId))
      .orderBy(desc(claimPredictions.createdAt));
  }
}

// ============================================================================
// 2. STORMY FIELD CO-PILOT SERVICE
// ============================================================================

export class FieldCopilotService {
  
  async startSession(data: InsertFieldCopilotSession) {
    const [session] = await db.insert(fieldCopilotSessions).values(data as any).returning();
    return session;
  }

  async endSession(sessionId: number) {
    const [session] = await db.update(fieldCopilotSessions)
      .set({ status: 'completed', endedAt: new Date() })
      .where(eq(fieldCopilotSessions.id, sessionId))
      .returning();
    return session;
  }

  async getActiveSession(userId: string) {
    const sessions = await db.select().from(fieldCopilotSessions)
      .where(and(
        eq(fieldCopilotSessions.userId, userId),
        eq(fieldCopilotSessions.status, 'active')
      ))
      .orderBy(desc(fieldCopilotSessions.startedAt))
      .limit(1);
    return sessions[0] || null;
  }

  async recordGuidanceEvent(data: InsertCopilotGuidanceEvent) {
    const [event] = await db.insert(copilotGuidanceEvents).values(data).returning();
    
    await db.update(fieldCopilotSessions)
      .set({ totalGuidanceEvents: sql`${fieldCopilotSessions.totalGuidanceEvents} + 1` })
      .where(eq(fieldCopilotSessions.id, data.sessionId));
    
    return event;
  }

  async getGuidanceForContext(sessionId: number, visualContext: string, currentStep: string) {
    const startTime = Date.now();
    
    const prompt = `You are Stormy, an expert field inspection AI co-pilot. Provide real-time guidance for the inspector.

Current Inspection Step: ${currentStep}
Visual Context: ${visualContext}

Provide concise, actionable guidance that helps the inspector:
1. Complete the current step correctly
2. Identify any issues or concerns
3. Know what to document or photograph
4. Understand what comes next

Keep response under 150 words for voice readability.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      const guidance = response.choices[0].message.content || '';
      const responseTime = Date.now() - startTime;

      await this.recordGuidanceEvent({
        sessionId,
        eventType: 'ai_guidance',
        triggerSource: 'visual_query',
        guidanceContent: guidance,
        visualContext,
        responseTimeMs: responseTime,
      });

      return { guidance, responseTimeMs: responseTime };
    } catch (error) {
      console.error('Guidance error:', error);
      throw error;
    }
  }

  async registerWearableDevice(data: InsertWearableDeviceRecord) {
    const [device] = await db.insert(wearableDevices).values(data).returning();
    return device;
  }

  async getUserWearables(userId: string) {
    return db.select().from(wearableDevices)
      .where(and(
        eq(wearableDevices.userId, userId),
        eq(wearableDevices.isActive, true)
      ));
  }

  async updateWearableConnection(deviceId: string) {
    await db.update(wearableDevices)
      .set({ lastConnectedAt: new Date() })
      .where(eq(wearableDevices.deviceId, deviceId));
  }
}

// ============================================================================
// 3. SMART SENSOR NETWORK (IoT) SERVICE
// ============================================================================

export class IoTSensorService {
  
  async registerDevice(data: InsertIotDevice) {
    const [device] = await db.insert(iotDevices).values(data as any).returning();
    return device;
  }

  async getPropertyDevices(propertyId: number) {
    return db.select().from(iotDevices)
      .where(eq(iotDevices.propertyId, propertyId));
  }

  async recordReading(data: InsertSensorReading) {
    const [reading] = await db.insert(sensorReadings).values(data).returning();
    
    await db.update(iotDevices)
      .set({ lastCommunication: new Date() })
      .where(eq(iotDevices.id, data.deviceId));

    await this.checkAlertThresholds(data.deviceId, data.readingType, data.value);
    
    return reading;
  }

  async checkAlertThresholds(deviceId: number, readingType: string, value: number) {
    const devices = await db.select().from(iotDevices)
      .where(eq(iotDevices.id, deviceId));
    
    if (!devices[0]?.alertThresholds) return;

    const thresholds = devices[0].alertThresholds;
    const device = devices[0];

    for (const threshold of thresholds) {
      if (threshold.metric !== readingType) continue;

      let triggered = false;
      switch (threshold.operator) {
        case 'gt': triggered = value > threshold.value; break;
        case 'lt': triggered = value < threshold.value; break;
        case 'gte': triggered = value >= threshold.value; break;
        case 'lte': triggered = value <= threshold.value; break;
        case 'eq': triggered = value === threshold.value; break;
      }

      if (triggered) {
        await db.insert(sensorAlerts).values({
          deviceId,
          propertyId: device.propertyId,
          alertType: readingType,
          severity: threshold.severity,
          message: `${readingType} reading of ${value} exceeded threshold of ${threshold.value}`,
          triggerValue: value,
          thresholdValue: threshold.value,
        });
      }
    }
  }

  async getUnacknowledgedAlerts(propertyId?: number) {
    if (propertyId) {
      return db.select().from(sensorAlerts)
        .where(and(
          eq(sensorAlerts.acknowledged, false),
          eq(sensorAlerts.propertyId, propertyId)
        ))
        .orderBy(desc(sensorAlerts.createdAt));
    }
    
    return db.select().from(sensorAlerts)
      .where(eq(sensorAlerts.acknowledged, false))
      .orderBy(desc(sensorAlerts.createdAt));
  }

  async acknowledgeAlert(alertId: number, acknowledgedBy: string) {
    const [alert] = await db.update(sensorAlerts)
      .set({ 
        acknowledged: true, 
        acknowledgedBy, 
        acknowledgedAt: new Date() 
      })
      .where(eq(sensorAlerts.id, alertId))
      .returning();
    return alert;
  }

  async getDeviceReadings(deviceId: number, hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return db.select().from(sensorReadings)
      .where(and(
        eq(sensorReadings.deviceId, deviceId),
        gte(sensorReadings.recordedAt, cutoff)
      ))
      .orderBy(desc(sensorReadings.recordedAt));
  }
}

// ============================================================================
// 4. DRONE INTEGRATION SERVICE
// ============================================================================

export class DroneIntegrationService {
  
  async registerPilot(data: InsertDronePilot) {
    const [pilot] = await db.insert(dronePilots).values(data).returning();
    return pilot;
  }

  async registerDrone(data: InsertDroneAsset) {
    const [drone] = await db.insert(droneAssets).values(data).returning();
    return drone;
  }

  async getAvailableDrones(ownerId?: number) {
    if (ownerId) {
      return db.select().from(droneAssets)
        .where(and(
          eq(droneAssets.status, 'available'),
          eq(droneAssets.ownerId, ownerId)
        ));
    }
    
    return db.select().from(droneAssets)
      .where(eq(droneAssets.status, 'available'));
  }

  async planFlightSession(data: InsertFlightSession) {
    const [session] = await db.insert(flightSessions).values(data as any).returning();
    
    await db.update(droneAssets)
      .set({ status: 'reserved' })
      .where(eq(droneAssets.id, data.droneId));
    
    return session;
  }

  async startFlight(sessionId: number) {
    const [session] = await db.update(flightSessions)
      .set({ status: 'in_progress', startTime: new Date() })
      .where(eq(flightSessions.id, sessionId))
      .returning();
    
    if (session) {
      await db.update(droneAssets)
        .set({ status: 'in_flight' })
        .where(eq(droneAssets.id, session.droneId));
    }
    
    return session;
  }

  async completeFlight(sessionId: number, flightData: {
    endTime: Date;
    distanceCovered: number;
    photosCapture: number;
    thermalMaps?: any[];
    model3D?: any;
  }) {
    const [session] = await db.update(flightSessions)
      .set({
        status: 'completed',
        endTime: flightData.endTime,
        actualDuration: Math.round((flightData.endTime.getTime() - Date.now()) / 60000),
        distanceCovered: flightData.distanceCovered,
        photosCapture: flightData.photosCapture,
        thermalMaps: flightData.thermalMaps,
        model3D: flightData.model3D,
      })
      .where(eq(flightSessions.id, sessionId))
      .returning();
    
    if (session) {
      await db.update(droneAssets)
        .set({ status: 'available' })
        .where(eq(droneAssets.id, session.droneId));
      
      await db.update(dronePilots)
        .set({ totalFlightHours: sql`${dronePilots.totalFlightHours} + ${(session.actualDuration || 0) / 60}` })
        .where(eq(dronePilots.id, session.pilotId));
    }
    
    return session;
  }

  async getFlightHistory(propertyId?: number, pilotId?: number) {
    let conditions = [];
    if (propertyId) conditions.push(eq(flightSessions.propertyId, propertyId));
    if (pilotId) conditions.push(eq(flightSessions.pilotId, pilotId));
    
    let query = db.select().from(flightSessions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(flightSessions.createdAt));
  }
}

// ============================================================================
// 5. INSURANCE CARRIER CONSOLE SERVICE
// ============================================================================

export class CarrierConsoleService {
  
  async createCarrierAccount(data: InsertCarrierAccount) {
    const apiKey = `wsc_${Math.random().toString(36).substring(2, 34)}`;
    const [carrier] = await db.insert(carrierAccounts).values({
      ...data,
      apiKey,
    } as any).returning();
    return carrier;
  }

  async getCarrierByApiKey(apiKey: string) {
    const carriers = await db.select().from(carrierAccounts)
      .where(eq(carrierAccounts.apiKey, apiKey));
    return carriers[0] || null;
  }

  async addCarrierUser(data: InsertCarrierUser) {
    const [user] = await db.insert(carrierUsers).values(data).returning();
    return user;
  }

  async submitClaimToCarrier(data: InsertCarrierClaimSubmission) {
    const [submission] = await db.insert(carrierClaimSubmissions).values(data).returning();
    return submission;
  }

  async getCarrierSubmissions(carrierId: number, status?: string) {
    if (status) {
      return db.select().from(carrierClaimSubmissions)
        .where(and(
          eq(carrierClaimSubmissions.carrierId, carrierId),
          eq(carrierClaimSubmissions.adjudicationStatus, status)
        ))
        .orderBy(desc(carrierClaimSubmissions.submittedAt));
    }
    
    return db.select().from(carrierClaimSubmissions)
      .where(eq(carrierClaimSubmissions.carrierId, carrierId))
      .orderBy(desc(carrierClaimSubmissions.submittedAt));
  }

  async updateSubmissionStatus(submissionId: number, status: string, decision?: string, approvedAmount?: number) {
    const updateData: any = { adjudicationStatus: status };
    if (decision) {
      updateData.decision = decision;
      updateData.decidedAt = new Date();
    }
    if (approvedAmount !== undefined) {
      updateData.approvedAmount = approvedAmount;
    }
    
    const [submission] = await db.update(carrierClaimSubmissions)
      .set(updateData)
      .where(eq(carrierClaimSubmissions.id, submissionId))
      .returning();
    return submission;
  }

  async generateAISummary(projectData: any) {
    const prompt = `Generate a concise insurance claim summary for adjusters based on this inspection data:
${JSON.stringify(projectData)}

Provide a professional 2-3 paragraph summary highlighting:
1. Damage extent and type
2. Cause of loss determination
3. Recommended action`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  }
}

// ============================================================================
// 6. CONTRACTOR MARKETPLACE SERVICE
// ============================================================================

export class ContractorMarketplaceService {
  
  async createContractorProfile(data: InsertContractorProfile) {
    const [profile] = await db.insert(contractorProfiles).values(data as any).returning();
    return profile;
  }

  async searchContractors(criteria: {
    specialties?: string[];
    serviceArea?: string;
    minRating?: number;
  }) {
    let query = db.select().from(contractorProfiles)
      .where(and(
        eq(contractorProfiles.isActive, true),
        eq(contractorProfiles.verificationStatus, 'verified')
      ));
    
    return query.orderBy(desc(contractorProfiles.createdAt));
  }

  async createRepairJob(data: InsertRepairJob) {
    const [job] = await db.insert(repairJobs).values(data).returning();
    return job;
  }

  async getOpenJobs(specialties?: string[]) {
    return db.select().from(repairJobs)
      .where(eq(repairJobs.status, 'open'))
      .orderBy(desc(repairJobs.createdAt));
  }

  async submitBid(data: InsertContractorBid) {
    const [bid] = await db.insert(contractorBids).values(data).returning();
    return bid;
  }

  async getJobBids(jobId: number) {
    return db.select().from(contractorBids)
      .where(eq(contractorBids.jobId, jobId))
      .orderBy(contractorBids.bidAmount);
  }

  async acceptBid(bidId: number, jobId: number) {
    await db.update(contractorBids)
      .set({ isWinningBid: true, status: 'accepted' })
      .where(eq(contractorBids.id, bidId));
    
    const bids = await db.select().from(contractorBids)
      .where(eq(contractorBids.id, bidId));
    
    if (bids[0]) {
      await db.update(repairJobs)
        .set({ 
          status: 'assigned', 
          selectedContractorId: bids[0].contractorId 
        })
        .where(eq(repairJobs.id, jobId));
    }
    
    await db.update(contractorBids)
      .set({ status: 'rejected' })
      .where(and(
        eq(contractorBids.jobId, jobId),
        sql`${contractorBids.id} != ${bidId}`
      ));
  }

  async recordReferralFee(data: InsertReferralFee) {
    const [fee] = await db.insert(referralFees).values(data).returning();
    return fee;
  }

  async getContractorReferrals(contractorId: number) {
    return db.select().from(referralFees)
      .where(eq(referralFees.contractorId, contractorId))
      .orderBy(desc(referralFees.createdAt));
  }
}

// ============================================================================
// 7. REGIONAL RISK INTELLIGENCE SERVICE
// ============================================================================

export class RiskIntelligenceService {
  
  async createRegion(data: InsertRiskRegion) {
    const [region] = await db.insert(riskRegions).values(data).returning();
    return region;
  }

  async getRegions(state?: string) {
    let query = db.select().from(riskRegions);
    if (state) {
      query = query.where(eq(riskRegions.state, state)) as any;
    }
    return query;
  }

  async calculateRiskAssessment(regionId: number, periodStart: Date, periodEnd: Date) {
    const outcomes = await db.select().from(claimOutcomes)
      .where(and(
        gte(claimOutcomes.createdAt, periodStart),
        lte(claimOutcomes.createdAt, periodEnd)
      ));

    if (outcomes.length < 10) {
      throw new Error('Insufficient data for risk assessment');
    }

    const totalClaims = outcomes.length;
    const avgSeverity = outcomes.reduce((sum, o) => sum + (o.claimAmount || 0), 0) / totalClaims;
    
    const damageTypes: Record<string, number> = {};
    outcomes.forEach(o => {
      damageTypes[o.claimType] = (damageTypes[o.claimType] || 0) + 1;
    });

    const riskScore = Math.min(100, (totalClaims / 10) * (avgSeverity / 50000) * 100);

    const assessment: InsertRiskAssessment = {
      regionId,
      assessmentPeriod: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
      metrics: {
        hailFrequency: damageTypes['hail'] || 0,
        windDamageFrequency: damageTypes['wind'] || 0,
        floodRisk: damageTypes['flood'] || 0,
        avgClaimSeverity: avgSeverity,
        avgPropertyAge: 0,
        predominantRoofTypes: {},
      },
      riskScore,
      riskCategory: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      trends: [],
      sampleSize: totalClaims,
      confidenceLevel: totalClaims > 50 ? 0.9 : totalClaims > 20 ? 0.7 : 0.5,
    };

    const [saved] = await db.insert(riskAssessments).values(assessment as any).returning();
    return saved;
  }

  async getRegionRiskAssessments(regionId: number) {
    return db.select().from(riskAssessments)
      .where(eq(riskAssessments.regionId, regionId))
      .orderBy(desc(riskAssessments.createdAt));
  }

  async createDataExport(data: InsertRiskDataExport) {
    const [exportRecord] = await db.insert(riskDataExports).values(data).returning();
    return exportRecord;
  }

  async getCarrierExports(carrierId: number) {
    return db.select().from(riskDataExports)
      .where(eq(riskDataExports.carrierId, carrierId))
      .orderBy(desc(riskDataExports.createdAt));
  }
}

// ============================================================================
// 8. INNOVATION MODULE MANAGEMENT
// ============================================================================

export class InnovationModuleService {
  
  async getAvailableModules() {
    return db.select().from(innovationModules)
      .orderBy(innovationModules.category, innovationModules.moduleName);
  }

  async getModuleByCode(moduleCode: string) {
    const modules = await db.select().from(innovationModules)
      .where(eq(innovationModules.moduleCode, moduleCode));
    return modules[0] || null;
  }

  async createModule(data: InsertInnovationModule) {
    const [module] = await db.insert(innovationModules).values(data as any).returning();
    return module;
  }

  async enableModuleForOrg(orgId: number, moduleId: number, enabledBy: string) {
    const [orgModule] = await db.insert(organizationModules).values({
      organizationId: orgId,
      moduleId,
      enabled: true,
      enabledBy,
      enabledAt: new Date(),
    }).returning();
    return orgModule;
  }

  async disableModuleForOrg(orgId: number, moduleId: number) {
    await db.update(organizationModules)
      .set({ enabled: false })
      .where(and(
        eq(organizationModules.organizationId, orgId),
        eq(organizationModules.moduleId, moduleId)
      ));
  }

  async getOrgEnabledModules(orgId: number) {
    return db.select({
      module: innovationModules,
      orgConfig: organizationModules,
    })
    .from(organizationModules)
    .innerJoin(innovationModules, eq(organizationModules.moduleId, innovationModules.id))
    .where(and(
      eq(organizationModules.organizationId, orgId),
      eq(organizationModules.enabled, true)
    ));
  }

  async seedDefaultModules() {
    const modules = [
      {
        moduleCode: 'predictive_claims',
        moduleName: 'Predictive Claim Outcome Engine',
        description: 'AI-powered claim success prediction using historical data and insurer patterns',
        category: 'ai_intelligence',
        status: 'preview',
        requiredSubscription: 'enterprise',
      },
      {
        moduleCode: 'field_copilot',
        moduleName: 'Stormy Field Co-Pilot',
        description: 'Real-time AI guidance during inspections with wearable integration',
        category: 'field_operations',
        status: 'preview',
        requiredSubscription: 'professional',
      },
      {
        moduleCode: 'iot_sensors',
        moduleName: 'Smart Sensor Network',
        description: 'Property monitoring sensors for moisture, impact, and environmental tracking',
        category: 'iot_hardware',
        status: 'coming_soon',
        requiredSubscription: 'enterprise',
      },
      {
        moduleCode: 'drone_integration',
        moduleName: 'Drone Flight Integration',
        description: 'Autonomous drone flights with thermal mapping and 3D modeling',
        category: 'field_operations',
        status: 'preview',
        requiredSubscription: 'professional',
      },
      {
        moduleCode: 'carrier_console',
        moduleName: 'Insurance Carrier Console',
        description: 'White-label portal for insurance companies to receive structured claims',
        category: 'enterprise',
        status: 'preview',
        requiredSubscription: 'enterprise',
      },
      {
        moduleCode: 'contractor_marketplace',
        moduleName: 'Contractor Marketplace',
        description: 'Matching verified contractors with property owners for repairs',
        category: 'marketplace',
        status: 'coming_soon',
        requiredSubscription: 'professional',
      },
      {
        moduleCode: 'risk_intelligence',
        moduleName: 'Regional Risk Intelligence',
        description: 'Anonymized data product for insurers and reinsurers',
        category: 'data_products',
        status: 'coming_soon',
        requiredSubscription: 'enterprise',
      },
    ];

    for (const mod of modules) {
      await db.insert(innovationModules).values(mod as any)
        .onConflictDoNothing();
    }
  }
}

// Export singleton instances
export const predictiveClaimEngine = new PredictiveClaimEngine();
export const fieldCopilotService = new FieldCopilotService();
export const iotSensorService = new IoTSensorService();
export const droneIntegrationService = new DroneIntegrationService();
export const carrierConsoleService = new CarrierConsoleService();
export const contractorMarketplaceService = new ContractorMarketplaceService();
export const riskIntelligenceService = new RiskIntelligenceService();
export const innovationModuleService = new InnovationModuleService();
