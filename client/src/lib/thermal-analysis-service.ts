export interface ThermalAnomalyResult {
  anomalies: ThermalAnomaly[];
  overallScore: number;
  moistureRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
  analysisTimestamp: string;
}

export interface ThermalAnomaly {
  id: string;
  type: 'moisture' | 'heat_loss' | 'thermal_bridging' | 'air_infiltration' | 'equipment_issue';
  severity: 'minor' | 'moderate' | 'severe';
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  temperatureDelta: number;
  description: string;
  confidence: number;
}

export interface ThermalAnalysisRequest {
  imageDataUrl: string;
  inspectionStep: string;
  propertyType?: string;
  roofType?: string;
  ambientTemperature?: number;
  weatherConditions?: string;
}

class ThermalAnalysisService {
  private baseUrl: string = '';

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async analyzeThermalImage(request: ThermalAnalysisRequest): Promise<ThermalAnomalyResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/analyze-thermal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Thermal analysis failed:', error);
      return this.generateFallbackAnalysis();
    }
  }

  private generateFallbackAnalysis(): ThermalAnomalyResult {
    return {
      anomalies: [],
      overallScore: 0,
      moistureRisk: 'low',
      recommendations: [
        'Unable to perform thermal analysis. Please retry with a clear thermal image.',
        'Ensure the thermal image has sufficient temperature differential.',
      ],
      analysisTimestamp: new Date().toISOString(),
    };
  }

  interpretAnomalyType(type: ThermalAnomaly['type']): {
    title: string;
    description: string;
    actionRequired: string;
  } {
    const interpretations = {
      moisture: {
        title: 'Potential Moisture Intrusion',
        description: 'Cooler areas may indicate trapped moisture in the roofing system.',
        actionRequired: 'Perform moisture testing to confirm water presence.',
      },
      heat_loss: {
        title: 'Heat Loss Detected',
        description: 'Warmer areas on the exterior may indicate insulation failure.',
        actionRequired: 'Document for energy efficiency recommendations.',
      },
      thermal_bridging: {
        title: 'Thermal Bridge',
        description: 'Heat transfer through structural elements bypassing insulation.',
        actionRequired: 'Note for building envelope assessment.',
      },
      air_infiltration: {
        title: 'Air Infiltration',
        description: 'Temperature variations suggesting air leakage at seams or penetrations.',
        actionRequired: 'Check flashings and seals in the affected area.',
      },
      equipment_issue: {
        title: 'Equipment Anomaly',
        description: 'Unusual heat signature from mechanical equipment.',
        actionRequired: 'Verify equipment operation and document condition.',
      },
    };

    return interpretations[type];
  }

  getSeverityColor(severity: ThermalAnomaly['severity']): string {
    switch (severity) {
      case 'severe': return 'text-red-500';
      case 'moderate': return 'text-yellow-500';
      case 'minor': return 'text-blue-500';
      default: return 'text-white/60';
    }
  }

  getSeverityBadgeColor(severity: ThermalAnomaly['severity']): string {
    switch (severity) {
      case 'severe': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'minor': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-white/10 text-white/60 border-white/30';
    }
  }

  getMoistureRiskColor(risk: ThermalAnomalyResult['moistureRisk']): string {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-white/60';
    }
  }

  formatTemperatureDelta(delta: number): string {
    const absValue = Math.abs(delta).toFixed(1);
    return delta > 0 ? `+${absValue}°F` : `-${absValue}°F`;
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    if (confidence >= 0.5) return 'Low';
    return 'Very Low';
  }
}

export const thermalAnalysisService = new ThermalAnalysisService();
