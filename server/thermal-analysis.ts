import OpenAI from "openai";
import { ThermalReading, DetailedIssue, InspectionMetric } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert thermal imaging analyst specializing in commercial roofing systems. Analyze the thermal image and provide detailed findings in JSON format.

Focus on:
1. Temperature anomalies and patterns
2. Moisture detection and water infiltration
3. Insulation gaps and thermal bridging
4. Structural integrity indicators
5. Energy efficiency issues
6. Equipment performance analysis

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
              
              Provide comprehensive thermal analysis focusing on commercial roofing systems.`
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
      max_tokens: 4000
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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional thermal imaging report writer for commercial roofing. Generate a comprehensive executive summary based on the thermal analysis results."
        },
        {
          role: "user",
          content: `Generate a professional executive summary for thermal imaging analysis of ${buildingInfo.buildingName} at ${buildingInfo.address}.
          
          Analysis Results: ${JSON.stringify(analysisResults)}
          
          Include:
          - Overall thermal performance assessment
          - Critical findings and priorities
          - Energy efficiency observations
          - Maintenance recommendations
          - Risk assessment
          
          Write in professional, technical language appropriate for facility managers and building owners.`
        }
      ],
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating thermal report:', error);
    throw new Error('Failed to generate thermal report: ' + error.message);
  }
}