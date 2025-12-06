import { WinnMethodologyStep } from '@shared/schema';

export interface StepRequirement {
  minPhotos: number;
  requiredFields: string[];
  aiValidationRequired: boolean;
  canSkip: boolean;
  skipReasons?: string[];
}

export interface ValidationResult {
  canAdvance: boolean;
  blockers: ValidationBlocker[];
  warnings: string[];
  completionPercentage: number;
  stormyMessage: string;
}

export interface ValidationBlocker {
  type: 'photos' | 'ai_validation' | 'required_field' | 'quality' | 'location';
  message: string;
  currentValue: number | string | boolean;
  requiredValue: number | string | boolean;
  priority: 'critical' | 'high' | 'medium';
}

export interface EvidenceItem {
  id: number | string;
  type: string;
  url?: string;
  localPath?: string;
  aiAnalysis?: {
    isValid?: boolean;
    confidence?: number;
    anomalies?: string[];
    qualityScore?: number;
  };
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

const STEP_REQUIREMENTS: Record<WinnMethodologyStep, StepRequirement> = {
  weather_verification: {
    minPhotos: 0,
    requiredFields: ['weatherData'],
    aiValidationRequired: false,
    canSkip: false,
  },
  thermal_imaging: {
    minPhotos: 3,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: false,
  },
  terrestrial_walk: {
    minPhotos: 4,
    requiredFields: [],
    aiValidationRequired: false,
    canSkip: false,
  },
  test_squares: {
    minPhotos: 2,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: true,
    skipReasons: ['No test squares needed', 'Property type does not require'],
  },
  soft_metals: {
    minPhotos: 2,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: true,
    skipReasons: ['No soft metals present on property', 'Inaccessible areas'],
  },
  moisture_testing: {
    minPhotos: 2,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: true,
    skipReasons: ['No moisture issues detected', 'Weather conditions prevent testing'],
  },
  core_samples: {
    minPhotos: 2,
    requiredFields: [],
    aiValidationRequired: true,
    canSkip: true,
    skipReasons: ['Core samples not authorized', 'Roof system does not require'],
  },
  report_assembly: {
    minPhotos: 0,
    requiredFields: [],
    aiValidationRequired: false,
    canSkip: false,
  },
};

const STORMY_MESSAGES = {
  ready: [
    "Looking great! You've captured everything needed for this step. Ready to move forward!",
    "Excellent work! All requirements met. Let's proceed to the next step!",
    "Perfect documentation! You're following the Winn Methodology precisely.",
  ],
  almost: [
    "You're almost there! Just a few more items to complete this step properly.",
    "Good progress! A couple more things and we'll be ready to advance.",
    "Nearly complete! Let's finish strong on this step.",
  ],
  needsWork: [
    "Let's focus on getting the essentials captured first. Quality documentation is key!",
    "We need more evidence before moving on. Remember: thorough documentation protects everyone.",
    "Take your time here. The Winn Methodology ensures we don't miss anything important.",
  ],
  qualityIssue: [
    "Some of your photos need better quality. Try to ensure good lighting and focus.",
    "The AI detected quality issues. Let's recapture those shots for the report.",
    "Clear, well-lit photos make all the difference in a professional report.",
  ],
};

function getRandomMessage(category: keyof typeof STORMY_MESSAGES): string {
  const messages = STORMY_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function validateStepCompletion(
  step: WinnMethodologyStep,
  evidence: EvidenceItem[],
  stepData?: Record<string, any>
): ValidationResult {
  const requirements = STEP_REQUIREMENTS[step];
  const blockers: ValidationBlocker[] = [];
  const warnings: string[] = [];
  let completedChecks = 0;
  let totalChecks = 0;

  totalChecks++;
  if (evidence.length >= requirements.minPhotos) {
    completedChecks++;
  } else {
    blockers.push({
      type: 'photos',
      message: `Need ${requirements.minPhotos - evidence.length} more photo${requirements.minPhotos - evidence.length === 1 ? '' : 's'}`,
      currentValue: evidence.length,
      requiredValue: requirements.minPhotos,
      priority: 'critical',
    });
  }

  if (requirements.aiValidationRequired) {
    totalChecks++;
    const validatedEvidence = evidence.filter(e => e.aiAnalysis?.isValid);
    if (validatedEvidence.length > 0) {
      completedChecks++;
    } else if (evidence.length > 0) {
      blockers.push({
        type: 'ai_validation',
        message: 'AI validation required - analyze your photos with Stormy',
        currentValue: validatedEvidence.length,
        requiredValue: 1,
        priority: 'critical',
      });
    }
  }

  for (const field of requirements.requiredFields) {
    totalChecks++;
    if (stepData?.[field]) {
      completedChecks++;
    } else {
      blockers.push({
        type: 'required_field',
        message: `Missing required: ${field.replace(/([A-Z])/g, ' $1').trim()}`,
        currentValue: false,
        requiredValue: true,
        priority: 'high',
      });
    }
  }

  const lowQualityEvidence = evidence.filter(e => 
    e.aiAnalysis?.qualityScore !== undefined && e.aiAnalysis.qualityScore < 0.6
  );
  if (lowQualityEvidence.length > 0) {
    warnings.push(`${lowQualityEvidence.length} photo${lowQualityEvidence.length === 1 ? '' : 's'} may have quality issues`);
  }

  const evidenceWithoutLocation = evidence.filter(e => !e.latitude || !e.longitude);
  if (evidenceWithoutLocation.length > 0 && evidence.length > 0) {
    warnings.push(`${evidenceWithoutLocation.length} item${evidenceWithoutLocation.length === 1 ? '' : 's'} missing GPS location`);
  }

  const completionPercentage = totalChecks > 0 
    ? Math.round((completedChecks / totalChecks) * 100) 
    : 100;

  const canAdvance = blockers.filter(b => b.priority === 'critical').length === 0;

  let stormyMessage: string;
  if (canAdvance && blockers.length === 0 && warnings.length === 0) {
    stormyMessage = getRandomMessage('ready');
  } else if (completionPercentage >= 70) {
    stormyMessage = getRandomMessage('almost');
  } else if (lowQualityEvidence.length > 0) {
    stormyMessage = getRandomMessage('qualityIssue');
  } else {
    stormyMessage = getRandomMessage('needsWork');
  }

  return {
    canAdvance,
    blockers,
    warnings,
    completionPercentage,
    stormyMessage,
  };
}

export function getStepRequirements(step: WinnMethodologyStep): StepRequirement {
  return STEP_REQUIREMENTS[step];
}

export function canSkipStep(step: WinnMethodologyStep): { canSkip: boolean; reasons: string[] } {
  const requirements = STEP_REQUIREMENTS[step];
  return {
    canSkip: requirements.canSkip,
    reasons: requirements.skipReasons || [],
  };
}

export function getStepGuidance(step: WinnMethodologyStep): {
  tips: string[];
  commonMistakes: string[];
  bestPractices: string[];
} {
  const guidance: Record<WinnMethodologyStep, { tips: string[]; commonMistakes: string[]; bestPractices: string[] }> = {
    weather_verification: {
      tips: [
        'Verify storm events from multiple weather sources',
        'Document hail size and wind speed reports',
        'Note the date(s) of reported weather events',
      ],
      commonMistakes: [
        'Using only one weather data source',
        'Not correlating weather events with damage patterns',
      ],
      bestPractices: [
        'Include NOAA, local weather stations, and radar data',
        'Create a timeline of weather events and damage discovery',
      ],
    },
    thermal_imaging: {
      tips: [
        'Thermal scans work best with at least 10°F temperature differential',
        'Morning or evening provides better thermal contrast',
        'Look for moisture intrusion patterns and thermal bridging',
      ],
      commonMistakes: [
        'Scanning during peak sun hours when surfaces are uniformly hot',
        'Not allowing the camera to calibrate to ambient temperature',
      ],
      bestPractices: [
        'Always capture a corresponding visual photo for each thermal image',
        'Document the emissivity settings used',
      ],
    },
    terrestrial_walk: {
      tips: [
        'Walk the entire perimeter of the property',
        'Document all four sides of the building',
        'Note any visible damage from ground level before going to the roof',
      ],
      commonMistakes: [
        'Forgetting to document the property address in photos',
        'Missing the overall property context',
      ],
      bestPractices: [
        'Include a timestamp and address marker in your first photo',
        'Capture the property from multiple angles',
      ],
    },
    test_squares: {
      tips: [
        'Select representative areas for test square analysis',
        'Document the square footage and location of each test area',
        'Count hail hits or damage per square accurately',
      ],
      commonMistakes: [
        'Selecting only damaged areas without control areas',
        'Inconsistent square sizing',
      ],
      bestPractices: [
        'Use standardized 10x10 foot test squares',
        'Document multiple test squares across different roof sections',
      ],
    },
    soft_metals: {
      tips: [
        'Check vents, flashings, gutters, and downspouts',
        'Look for dents, dings, and deformation',
        'Compare damaged vs undamaged soft metal areas',
      ],
      commonMistakes: [
        'Missing soft metal damage on inaccessible areas',
        'Confusing manufacturing defects with hail damage',
      ],
      bestPractices: [
        'Photograph with proper scale references',
        'Document all soft metal locations on the property',
      ],
    },
    moisture_testing: {
      tips: [
        'Focus on areas identified as anomalies in thermal scanning',
        'Check around penetrations, seams, and edge details',
        'Document moisture meter readings with photos',
      ],
      commonMistakes: [
        'Only testing the visible wet spots',
        'Not calibrating the moisture meter for material type',
      ],
      bestPractices: [
        'Test in a grid pattern for comprehensive coverage',
        'Record readings numerically, not just presence/absence',
      ],
    },
    core_samples: {
      tips: [
        'Extract cores from representative damaged and undamaged areas',
        'Document core location precisely',
        'Measure and photograph each layer of the core',
      ],
      commonMistakes: [
        'Not sealing the core extraction site properly',
        'Extracting cores without property owner permission',
      ],
      bestPractices: [
        'Label cores immediately with location and date',
        'Preserve cores for potential laboratory analysis',
      ],
    },
    report_assembly: {
      tips: [
        'Review all captured evidence before generating',
        'Ensure consistent naming and organization',
        'Verify all required sections are complete',
      ],
      commonMistakes: [
        'Generating report before reviewing evidence quality',
        'Missing key findings in executive summary',
      ],
      bestPractices: [
        'Use the AI assistant to review completeness',
        'Preview report before final generation',
      ],
    },
  };

  return guidance[step];
}
