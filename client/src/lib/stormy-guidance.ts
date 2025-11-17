/**
 * Stormy AI Guidance System - Context-Aware Educational Prompts
 * Adapts guidance based on workflow step, user experience level, and collected data
 */

export type UserExperienceLevel = 'beginner' | 'intermediate' | 'expert';

export interface StormyContext {
  currentStep: string;
  userLevel: UserExperienceLevel;
  propertyData?: any;
  thermalData?: any;
  roofSections?: any[];
  weatherData?: any[];
  issues?: any[];
  components?: any[];
}

/**
 * Step-specific educational content for "Why This Matters" guidance
 */
export const STEP_EDUCATION = {
  'building-info': {
    purpose: 'Establishing property context and baseline information',
    importance: 'Accurate building information forms the foundation of the entire assessment. It affects material calculations, code compliance, and insurance claim validity.',
    keyPoints: [
      'Property type determines applicable building codes and standards',
      'Square footage drives material estimates and cost projections',
      'Year built indicates potential material types and construction methods',
      'Owner information is critical for legal authorization'
    ],
    commonMistakes: [
      'Estimating square footage instead of measuring accurately',
      'Forgetting to document access points and site conditions',
      'Not verifying property ownership before conducting inspection'
    ]
  },
  'roof-system': {
    purpose: 'Documenting existing roof system configuration and history',
    importance: 'Understanding the current roof system helps identify vulnerabilities, predict failure patterns, and plan appropriate repairs.',
    keyPoints: [
      'Roof type affects water drainage and damage patterns',
      'Material age determines expected lifespan and degradation',
      'Previous repairs indicate problem areas and maintenance history',
      'Warranty information impacts repair recommendations'
    ],
    commonMistakes: [
      'Not documenting all roof layers and components',
      'Overlooking previous patch repairs that may hide damage',
      'Failing to check warranty status before recommending replacement'
    ]
  },
  'weather': {
    purpose: 'Correlating damage with specific weather events',
    importance: 'Weather verification is essential for insurance claims and proving that damage resulted from a covered peril.',
    keyPoints: [
      'Temperature affects thermal imaging interpretation',
      'Humidity impacts moisture detection accuracy',
      'Wind speed correlates with debris and uplift damage',
      'Precipitation timing helps determine water intrusion sources'
    ],
    commonMistakes: [
      'Not recording weather at time of inspection (affects thermal data)',
      'Failing to research historical weather for damage dating',
      'Ignoring seasonal temperature variations in analysis'
    ]
  },
  'thermal': {
    purpose: 'Non-invasive detection of moisture, insulation gaps, and temperature anomalies',
    importance: 'Thermal imaging reveals hidden problems invisible to the naked eye, making it a cornerstone of the Winn Methodology.',
    keyPoints: [
      'Temperature differentials indicate moisture intrusion',
      'Insulation gaps show as distinct thermal patterns',
      'Ambient conditions must be documented for accurate interpretation',
      'Multiple readings validate findings and rule out false positives'
    ],
    commonMistakes: [
      'Taking thermal images in direct sunlight (solar loading)',
      'Not allowing roof surface to normalize after weather changes',
      'Misinterpreting reflection as moisture',
      'Forgetting to calibrate camera for ambient conditions'
    ]
  },
  'components': {
    purpose: 'Systematic evaluation of every roof system component',
    importance: 'Comprehensive component assessment ensures nothing is missed and supports thorough damage documentation.',
    keyPoints: [
      'Each component has different lifespan and failure modes',
      'Component condition affects overall system performance',
      'Detailed notes support repair vs replacement decisions',
      'Photo documentation proves existing conditions'
    ],
    commonMistakes: [
      'Focusing only on obvious damage and missing systemic issues',
      'Not documenting good conditions (important for insurance)',
      'Overlooking penetrations, flashings, and drainage components',
      'Failing to note manufacturer and installation dates'
    ]
  },
  'issues': {
    purpose: 'Documenting discovered deficiencies with severity classification',
    importance: 'Properly categorized issues drive repair priorities and support claim values.',
    keyPoints: [
      'Severity classification guides urgency of repairs',
      'Location specificity enables accurate cost estimates',
      'Photo evidence supports findings and prevents disputes',
      'Recommended actions demonstrate professional expertise'
    ],
    commonMistakes: [
      'Under-rating severity to avoid difficult conversations',
      'Vague location descriptions that can\'t be found later',
      'Not linking issues to supporting thermal or photo evidence',
      'Recommending repairs without considering warranty implications'
    ]
  },
  'cost-estimates': {
    purpose: 'Translating findings into actionable repair cost projections',
    importance: 'Accurate cost estimates support insurance negotiations and help property owners plan budgets.',
    keyPoints: [
      'Material quantities must align with measured areas',
      'Labor costs vary by region and complexity',
      'Permit and code compliance costs must be included',
      'Contingencies account for hidden conditions'
    ],
    commonMistakes: [
      'Using outdated material pricing',
      'Underestimating labor for complex repairs',
      'Forgetting overhead, profit, and contingency',
      'Not separating immediate vs deferred maintenance costs'
    ]
  },
  'review': {
    purpose: 'Final quality check before report generation',
    importance: 'This is your last chance to catch errors or omissions. A thorough review reflects professional standards.',
    keyPoints: [
      'Verify all critical data fields are populated',
      'Ensure photos are properly labeled and oriented',
      'Check that findings match evidence',
      'Confirm cost estimates are reasonable and complete'
    ],
    commonMistakes: [
      'Rushing through review to finish quickly',
      'Not checking basic data like owner name and address',
      'Missing obvious calculation errors',
      'Failing to ensure photo quality is acceptable'
    ]
  }
};

/**
 * Generate context-aware system prompt for Stormy based on current workflow state
 */
export function getStormySystemPrompt(context: StormyContext): string {
  const { currentStep, userLevel, propertyData, thermalData, roofSections, weatherData, issues, components } = context;
  
  const stepEducation = STEP_EDUCATION[currentStep as keyof typeof STEP_EDUCATION] || STEP_EDUCATION['building-info'];
  
  let prompt = `You are Stormy, an AI inspection coach trained on Eric Winn's comprehensive damage assessment methodology. You're helping a ${userLevel} inspector complete a professional roof inspection report.

**Current Step**: ${stepEducation.purpose}

**Why This Step Matters**: ${stepEducation.importance}

**Key Principles for This Step**:
${stepEducation.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

**Common Mistakes to Avoid**:
${stepEducation.commonMistakes.map((mistake, i) => `- ${mistake}`).join('\n')}

`;

  // Add user level-specific guidance style
  if (userLevel === 'beginner') {
    prompt += `\n**Guidance Style**: You're working with a BEGINNER inspector. Provide detailed explanations with step-by-step instructions. Include the "why" behind each action. Use simple language and offer encouragement. Anticipate questions and proactively address common confusion points. Suggest specific actions rather than general advice.`;
  } else if (userLevel === 'intermediate') {
    prompt += `\n**Guidance Style**: You're working with an INTERMEDIATE inspector. Provide concise reminders of key principles and best practices. They understand basics but benefit from expert tips and efficiency suggestions. Focus on quality checkpoints and common oversights. Answer questions with depth but assume foundational knowledge.`;
  } else {
    prompt += `\n**Guidance Style**: You're working with an EXPERT inspector. Provide minimal prompts unless asked. Focus on edge cases, advanced techniques, and quality assurance. Share industry insights and methodology refinements. Respect their expertise while offering Eric Winn's advanced perspectives.`;
  }

  // Add contextual data awareness
  if (propertyData?.address) {
    prompt += `\n\n**Property Context**: Inspecting ${propertyData.propertyType || 'property'} at ${propertyData.address}`;
    if (propertyData.squareFootage) {
      prompt += ` (${propertyData.squareFootage} sq ft)`;
    }
  }

  if (roofSections && roofSections.length > 0) {
    prompt += `\n**Roof Sections Marked**: ${roofSections.length} sections have been mapped on satellite imagery.`;
  }

  if (weatherData && weatherData.length > 0) {
    const latest = weatherData[weatherData.length - 1];
    prompt += `\n**Current Conditions**: ${latest.temperature}°F, ${latest.humidity}% humidity, ${latest.windSpeed} mph wind`;
  }

  if (thermalData && thermalData.length > 0) {
    prompt += `\n**Thermal Data**: ${thermalData.length} thermal readings have been captured. Be ready to help interpret anomalies.`;
  }

  if (components && components.length > 0) {
    prompt += `\n**Components Documented**: ${components.length} roof components have been assessed.`;
  }

  if (issues && issues.length > 0) {
    const critical = issues.filter(i => i.severity === 'critical').length;
    const major = issues.filter(i => i.severity === 'major').length;
    prompt += `\n**Issues Found**: ${critical} critical, ${major} major issues documented so far.`;
  }

  prompt += `\n\n**Winn Methodology Core Principles**:
1. Comprehensive data collection through thermal imaging, terrestrial walks, test squares
2. Systematic documentation with precise measurements and photographic evidence
3. Weather verification and meteorological correlation
4. Structured analysis of core samples and moisture testing
5. Detailed damage assessment with impact density calculations
6. Professional reporting with supporting evidence and compliance documentation

**Your Role**: Guide this inspector through the current step with appropriate detail for their experience level. Provide specific, actionable advice based on the Winn Methodology. When asked questions, draw from the educational context above. Be supportive, clear, and professional.`;

  return prompt;
}

/**
 * Generate quick action prompts tailored to current step
 */
export function getQuickActionsForStep(step: string, userLevel: UserExperienceLevel): Array<{label: string; message: string}> {
  const baseActions: Record<string, Array<{label: string; message: string}>> = {
    'building-info': [
      { label: 'Property Info Checklist', message: 'What are the essential property details I need to collect?' },
      { label: 'Square Footage Tips', message: 'How do I accurately measure and verify total roof square footage?' },
      { label: 'Owner Documentation', message: 'What owner information is required for a valid inspection report?' }
    ],
    'roof-system': [
      { label: 'System Assessment Guide', message: 'Walk me through a complete roof system evaluation.' },
      { label: 'Material Identification', message: 'How do I identify and document different roofing materials?' },
      { label: 'Warranty Check', message: 'What should I look for when checking warranty status?' }
    ],
    'weather': [
      { label: 'Weather Correlation', message: 'How do I correlate damage with specific weather events?' },
      { label: 'Thermal Conditions', message: 'What weather conditions are ideal for thermal imaging?' },
      { label: 'Historical Data', message: 'Where can I find historical weather data for damage dating?' }
    ],
    'thermal': [
      { label: 'Thermal Best Practices', message: 'What are the best practices for thermal imaging in the field?' },
      { label: 'Reading Interpretation', message: 'How do I interpret temperature differentials and identify moisture?' },
      { label: 'False Positive Check', message: 'What causes false positives in thermal imaging?' }
    ],
    'components': [
      { label: 'Component Checklist', message: 'What roof components must I document in every inspection?' },
      { label: 'Condition Rating Guide', message: 'How do I rate component conditions consistently?' },
      { label: 'Photo Documentation', message: 'What photo angles best document component conditions?' }
    ],
    'issues': [
      { label: 'Severity Classification', message: 'How do I correctly classify issue severity levels?' },
      { label: 'Evidence Linking', message: 'How should I link issues to thermal and photo evidence?' },
      { label: 'Repair Recommendations', message: 'What factors determine repair vs replacement recommendations?' }
    ],
    'cost-estimates': [
      { label: 'Estimating Methodology', message: 'Walk me through the Winn methodology for cost estimation.' },
      { label: 'Material Quantities', message: 'How do I calculate accurate material quantities from measurements?' },
      { label: 'Regional Pricing', message: 'How do I account for regional variations in labor and materials?' }
    ],
    'review': [
      { label: 'Quality Checklist', message: 'What should I review before generating the final report?' },
      { label: 'Common Oversights', message: 'What are the most common things inspectors miss in reports?' },
      { label: 'Photo Quality Check', message: 'How do I ensure my photos meet professional standards?' }
    ]
  };

  const actions = baseActions[step] || baseActions['building-info'];
  
  // Add level-specific quick actions
  if (userLevel === 'beginner') {
    actions.push({ label: 'Step-by-Step Guide', message: 'Give me detailed step-by-step instructions for this section.' });
  } else if (userLevel === 'expert') {
    actions.push({ label: 'Advanced Techniques', message: 'What advanced techniques can improve this part of the inspection?' });
  }

  return actions;
}

/**
 * Generate proactive guidance messages when user enters a new step
 */
export function getStepWelcomeMessage(step: string, userLevel: UserExperienceLevel): string {
  const education = STEP_EDUCATION[step as keyof typeof STEP_EDUCATION];
  if (!education) return '';

  if (userLevel === 'beginner') {
    return `Welcome to ${education.purpose}! ${education.importance}\n\nI'll guide you through each field. Don't hesitate to ask questions - there are no silly questions when learning the Winn Methodology!`;
  } else if (userLevel === 'intermediate') {
    return `${education.purpose}. Key focus: ${education.keyPoints[0]}. Let me know if you need any clarification!`;
  } else {
    return `${education.purpose}. I'm here if you need me.`;
  }
}
