import OpenAI from "openai";
import { ThermalReading, DetailedIssue, InspectionMetric } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ThermalAnalysisResult {
  thermalReadings: ThermalReading[];
  issues: DetailedIssue[];
  metrics: InspectionMetric[];
  summary: string;
  recommendations: string[];
  confidence: number;
}

export async function analyzeThermalImage(
  imageBase64: string,
  imageMetadata: {
    location: string;
    timestamp: Date;
    ambientTemp?: number;
    humidity?: number;
  }
): Promise<ThermalAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert thermal imaging analyst specializing in commercial roofing systems and damage assessment using the Eric Winn methodology. Analyze the thermal image and provide detailed findings in JSON format.

Focus on:
1. Temperature anomalies and patterns indicating potential damage
2. Moisture detection and water infiltration (critical for roof damage assessment)
3. Insulation gaps and thermal bridging
4. Structural integrity indicators and substrate damage
5. Energy efficiency issues
6. Impact damage signatures from hail or debris
7. Material degradation patterns

Provide response in this exact JSON format:
{
  "thermalReadings": [
    {
      "location": "string",
      "temperature": number,
      "timestamp": "ISO date string",
      "coordinates": {"x": number, "y": number},
      "alertLevel": "normal|caution|warning|critical"
    }
  ],
  "issues": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "severity": "critical|major|minor|informational",
      "category": "string",
      "location": "string",
      "coordinates": {"x": number, "y": number},
      "component": "string",
      "recommendedAction": "string",
      "urgency": "immediate|short_term|long_term|monitoring",
      "estimatedCost": number,
      "discoveredDate": "ISO date string",
      "reportedBy": "AI Thermal Analysis"
    }
  ],
  "metrics": [
    {
      "category": "string",
      "subcategory": "string",
      "name": "string",
      "value": number,
      "unit": "string",
      "threshold": number,
      "status": "pass|fail|caution",
      "location": "string",
      "notes": "string"
    }
  ],
  "summary": "string",
  "recommendations": ["string"],
  "confidence": number
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this thermal image from location: ${imageMetadata.location}
              Timestamp: ${imageMetadata.timestamp.toISOString()}
              ${imageMetadata.ambientTemp ? `Ambient Temperature: ${imageMetadata.ambientTemp}°F` : ''}
              ${imageMetadata.humidity ? `Humidity: ${imageMetadata.humidity}%` : ''}
              
              Provide comprehensive thermal analysis focusing on commercial roofing damage assessment using Eric Winn's methodology. Identify moisture intrusion, thermal anomalies, and potential impact damage areas.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4000 // GPT-5.1 uses max_completion_tokens instead of max_tokens
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Process and validate the response
    const thermalReadings: ThermalReading[] = result.thermalReadings.map((reading: any) => ({
      location: reading.location,
      temperature: reading.temperature,
      timestamp: new Date(reading.timestamp),
      coordinates: reading.coordinates,
      alertLevel: reading.alertLevel
    }));

    const issues: DetailedIssue[] = result.issues.map((issue: any) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      category: issue.category,
      location: issue.location,
      coordinates: issue.coordinates,
      component: issue.component,
      recommendedAction: issue.recommendedAction,
      urgency: issue.urgency,
      estimatedCost: issue.estimatedCost,
      images: [],
      thermalImages: [imageBase64],
      discoveredDate: new Date(issue.discoveredDate),
      reportedBy: issue.reportedBy
    }));

    const metrics: InspectionMetric[] = result.metrics.map((metric: any) => ({
      category: metric.category,
      subcategory: metric.subcategory,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      threshold: metric.threshold,
      status: metric.status,
      location: metric.location,
      notes: metric.notes
    }));

    return {
      thermalReadings,
      issues,
      metrics,
      summary: result.summary,
      recommendations: result.recommendations,
      confidence: result.confidence
    };

  } catch (error) {
    console.error('Error analyzing thermal image:', error);
    throw new Error('Failed to analyze thermal image: ' + error.message);
  }
}

export async function generateThermalReport(
  analysisResults: ThermalAnalysisResult[],
  buildingInfo: any
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional thermal imaging report writer for commercial roofing damage assessment using the Eric Winn methodology. Generate a comprehensive executive summary based on the thermal analysis results that can be used for insurance claims and restoration planning."
        },
        {
          role: "user",
          content: `Generate a professional executive summary for thermal imaging analysis of ${buildingInfo.buildingName} at ${buildingInfo.address}.
          
          Analysis Results: ${JSON.stringify(analysisResults)}
          
          Include:
          - Overall thermal performance and damage assessment
          - Critical findings and priorities (moisture intrusion, structural damage)
          - Documentation of anomalies for insurance claims
          - Maintenance and restoration recommendations
          - Risk assessment and urgency classification
          
          Write in professional, technical language appropriate for insurance adjusters, facility managers, and building owners. Follow Eric Winn's methodology for damage documentation.`
        }
      ],
      max_completion_tokens: 2000 // GPT-5.1 uses max_completion_tokens instead of max_tokens
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating thermal report:', error);
    throw new Error('Failed to generate thermal report: ' + error.message);
  }
}