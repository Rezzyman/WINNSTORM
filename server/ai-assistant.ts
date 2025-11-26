import OpenAI from 'openai';
import { storage } from './storage';
import { WinnMethodologyStep, AIStepValidation } from '@shared/schema';

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface AIAssistantRequest {
  message: string;
  context: string;
  conversationHistory?: any[];
  attachments?: string[];
}

// Multimodal image analysis request
export interface ImageAnalysisRequest {
  imageUrl: string;
  imageType: 'photo' | 'thermal' | 'drone' | 'document';
  step: WinnMethodologyStep;
  propertyContext?: string;
  previousFindings?: string[];
}

// Structured output from image analysis
export interface ImageAnalysisResult {
  validation: AIStepValidation;
  summary: string;
  detectedElements: {
    type: string;
    description: string;
    location?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }[];
  measurements?: {
    name: string;
    value: string;
    unit?: string;
  }[];
  recommendations: string[];
  coachingTips: string[];
}

export interface AIAssistantResponse {
  response: string;
  suggestions?: string[];
  actionable_items?: string[];
}

export async function getAIAssistance(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  try {
    // Query knowledge base for relevant methodology entries
    const knowledgeResults = await storage.searchKnowledge(request.message);
    const relevantKnowledge = knowledgeResults.slice(0, 3); // Top 3 most relevant entries
    
    let knowledgeContext = '';
    if (relevantKnowledge.length > 0) {
      knowledgeContext = '\n\n**ERIC WINN METHODOLOGY REFERENCE:**\n\n' + 
        relevantKnowledge.map(entry => 
          `### ${entry.title}\n${entry.content}\n`
        ).join('\n---\n');
    }
    
    const systemPrompt = `${request.context}${knowledgeContext}

You are Stormy, the WinnStorm™ AI Assistant, an expert in damage assessment consulting based on Eric Winn's proven methodology. You have deep expertise in:

1. **Thermal Inspection Analysis**
   - Interpreting thermal imaging data for moisture detection
   - Identifying temperature anomalies and insulation gaps
   - Analyzing thermal signatures for damage assessment

2. **Winn Methodology Implementation**
   - Systematic data collection procedures
   - Test square protocols and impact measurement
   - Core sampling techniques and analysis
   - Moisture testing procedures and interpretation

3. **Weather Verification & Correlation**
   - Meteorological data analysis
   - Hail size and impact correlation
   - Storm path verification and documentation

4. **Professional Documentation Standards**
   - Photo documentation requirements
   - Measurement protocols and precision
   - Report structure and evidence presentation
   - Compliance with industry standards

5. **Damage Assessment Expertise**
   - Identifying various types of roof damage
   - Impact density calculations
   - Material analysis and failure modes
   - Repair vs. replacement recommendations

**Response Guidelines:**
- Provide specific, actionable guidance
- Reference relevant inspection procedures when applicable
- Include measurement techniques and documentation requirements
- Suggest next steps or follow-up actions
- Maintain professional consulting tone
- Use industry-standard terminology
- Provide safety considerations when relevant

Keep responses concise but comprehensive, focusing on practical application of the Winn Methodology.`;

    // Build conversation context
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history for context
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      request.conversationHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Add current message
    messages.push({ role: 'user', content: request.message });

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', // the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages,
      max_completion_tokens: 1000, // GPT-5.1 uses max_completion_tokens instead of max_tokens
      // temperature is not specifiable for GPT-5.1 (always defaults to 1)
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Return the response directly for conversational AI
    return {
      response: content,
      suggestions: [],
      actionable_items: []
    };

  } catch (error) {
    console.error('AI Assistant error:', error);
    throw new Error('Failed to get AI assistance: ' + (error as Error).message);
  }
}

export async function analyzeInspectionData(data: {
  thermalReadings?: any[];
  roofSections?: any[];
  weatherData?: any;
  inspectionType: string;
}): Promise<{
  analysis: string;
  recommendations: string[];
  priority_items: string[];
  next_steps: string[];
}> {
  try {
    const prompt = `Analyze this inspection data using Eric Winn's methodology:

Inspection Type: ${data.inspectionType}
Thermal Readings: ${data.thermalReadings ? JSON.stringify(data.thermalReadings) : 'Not available'}
Roof Sections: ${data.roofSections ? JSON.stringify(data.roofSections) : 'Not available'}
Weather Data: ${data.weatherData ? JSON.stringify(data.weatherData) : 'Not available'}

Please provide a comprehensive analysis following the Winn Methodology, including:
1. Key findings and observations
2. Specific recommendations for further investigation
3. Priority items requiring immediate attention
4. Next steps in the inspection process

Format the response as JSON with the following structure:
{
  "analysis": "detailed analysis text",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "priority_items": ["priority item 1", "priority item 2"],
  "next_steps": ["step 1", "step 2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', // the newest OpenAI model is "gpt-5.1" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'You are an expert damage assessment consultant trained on Eric Winn\'s methodology. Provide detailed technical analysis based on inspection data.'
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1500, // GPT-5.1 uses max_completion_tokens instead of max_tokens
      // temperature is not specifiable for GPT-5.1 (always defaults to 1)
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);

  } catch (error) {
    console.error('Inspection analysis error:', error);
    throw new Error('Failed to analyze inspection data: ' + (error as Error).message);
  }
}

// Step-specific analysis prompts based on Winn Methodology
const STEP_ANALYSIS_PROMPTS: Record<WinnMethodologyStep, string> = {
  weather_verification: `Analyze this weather documentation image. Look for:
- Date stamps and location data that verify storm occurrence
- NOAA or meteorological source credibility markers
- Hail size indicators and storm severity data
- Geographic correlation with property location
This confirms the causation element for the damage claim.`,
  
  thermal_imaging: `Analyze this thermal image for roof damage indicators. Following Eric Winn's methodology, identify:
- Temperature anomalies indicating moisture intrusion (darker/cooler areas trapped moisture)
- Hot spots from sun exposure through damaged materials
- Thermal bridges indicating structural compromise
- Systematic patterns that distinguish damage from normal thermal variation
- Areas requiring further investigation with moisture meter
Color scale interpretation: Cooler colors (blue/purple) often indicate moisture; warmer colors (yellow/red) indicate dry materials.`,
  
  terrestrial_walk: `Analyze this standard photograph from the terrestrial damage walk. Look for:
- Visible hail impact damage (dents, fractures, granule loss)
- Wind damage patterns (lifted edges, missing materials)
- Mechanical damage vs. storm damage differentiation
- Age-related wear that should be excluded from claim
- Documentation completeness (is reference scale visible?)
Eric's tip: Always look for patterns - storm damage is random, mechanical damage is linear.`,
  
  test_squares: `Analyze this test square documentation image. Count and validate:
- Impact marks within the marked 10x10 area
- Consistency of impact size and shape with reported hail
- Damage density per square foot for threshold calculation
- Quality of marking and visibility of impacts
- Reference scale for measurement verification
Industry standard: 8+ impacts per 100 sq ft typically indicates replacement threshold.`,
  
  soft_metals: `Analyze this soft metals documentation image. Evaluate:
- Dent patterns on gutters, vents, flashings, or HVAC units
- Dent size correlation with reported hail diameter
- Reference object for scale (quarter = 24mm reference)
- Impact angle and direction consistency
- Fresh vs. old damage indicators
Soft metals are the "truth tellers" - they preserve impact evidence longer than shingles.`,
  
  moisture_testing: `Analyze this moisture testing documentation. Verify:
- Moisture meter positioning and reading visibility
- Reading values and their significance (>15% is concerning)
- Location correlation with thermal findings
- Multiple reading documentation for pattern establishment
- Meter type and calibration indicators
Correlate these readings with thermal anomalies to confirm moisture intrusion paths.`,
  
  core_samples: `Analyze this core sample documentation. Examine:
- Layer-by-layer material condition
- Moisture penetration depth indicators
- Material degradation patterns
- Proper sample extraction technique evidence
- Location marking and documentation
Core samples provide definitive evidence of substrate damage beneath surface materials.`,
  
  report_assembly: `Analyze this report documentation image for completeness:
- Evidence organization and labeling
- Date stamps and photo quality
- Measurement visibility and accuracy
- Professional presentation standards
- Claim support documentation checklist items
A well-organized report tells the complete story of the damage assessment.`
};

// Multimodal image analysis using GPT-5.1 vision
export async function analyzeInspectionImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
  try {
    const stepPrompt = STEP_ANALYSIS_PROMPTS[request.step];
    
    const systemPrompt = `You are Stormy, the WinnStorm AI inspection coach trained on Eric Winn's damage assessment methodology. 
You are analyzing an image captured during the "${request.step.replace(/_/g, ' ')}" step of a professional roof inspection.

Your role is to:
1. Analyze the image content thoroughly using your visual understanding
2. Validate whether this evidence meets the methodology requirements
3. Provide specific, actionable coaching based on what you observe
4. Identify any issues or areas needing improvement

${stepPrompt}

${request.propertyContext ? `Property Context: ${request.propertyContext}` : ''}
${request.previousFindings?.length ? `Previous Findings: ${request.previousFindings.join(', ')}` : ''}

Respond in JSON format with the following structure:
{
  "validation": {
    "isValid": boolean (true if image meets step requirements),
    "confidence": number (0-100, your confidence in the analysis),
    "findings": ["key finding 1", "key finding 2"],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "warnings": ["any concerns or issues"],
    "analysisTimestamp": "ISO timestamp"
  },
  "summary": "Brief 1-2 sentence summary of what you observe",
  "detectedElements": [
    {
      "type": "damage_type or feature",
      "description": "detailed description",
      "location": "where in image (optional)",
      "severity": "low|medium|high|critical (if applicable)",
      "confidence": number (0-100)
    }
  ],
  "measurements": [
    {"name": "measurement name", "value": "value", "unit": "unit"}
  ],
  "recommendations": ["What inspector should do next"],
  "coachingTips": ["Educational tips for improvement based on Eric Winn methodology"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${request.imageType} image from the ${request.step.replace(/_/g, ' ')} step. Provide detailed analysis following Eric Winn's methodology.`
            },
            {
              type: 'image_url',
              image_url: {
                url: request.imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI vision analysis');
    }

    const result = JSON.parse(content);
    
    // Ensure timestamp is set
    if (result.validation) {
      result.validation.analysisTimestamp = result.validation.analysisTimestamp || new Date().toISOString();
    }

    return result as ImageAnalysisResult;

  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Return a validation failure result instead of throwing
    return {
      validation: {
        isValid: false,
        confidence: 0,
        findings: ['Analysis failed - please try again'],
        recommendations: ['Ensure image is clear and properly formatted'],
        warnings: [(error as Error).message],
        analysisTimestamp: new Date().toISOString()
      },
      summary: 'Unable to analyze image due to an error',
      detectedElements: [],
      measurements: [],
      recommendations: ['Re-upload the image in a supported format (JPEG, PNG)'],
      coachingTips: ['Make sure images are well-lit and in focus']
    };
  }
}

// Contextual coaching based on current step and user experience level
export async function getStepCoaching(
  step: WinnMethodologyStep, 
  experienceLevel: 'beginner' | 'intermediate' | 'expert',
  currentFindings?: string[]
): Promise<{
  welcome: string;
  objectives: string[];
  checklist: string[];
  whyItMatters: string;
  commonMistakes: string[];
  tips: string[];
}> {
  try {
    const levelContext = {
      beginner: 'Provide detailed explanations, define technical terms, and offer step-by-step guidance.',
      intermediate: 'Assume basic knowledge, focus on best practices and efficiency tips.',
      expert: 'Be concise, focus on edge cases and advanced techniques only.'
    };

    const prompt = `You are Stormy, the WinnStorm inspection coach. Generate coaching content for the "${step.replace(/_/g, ' ')}" step.

User Experience Level: ${experienceLevel}
${levelContext[experienceLevel]}

${currentFindings?.length ? `Current inspection findings: ${currentFindings.join(', ')}` : 'No findings recorded yet.'}

Generate coaching content in JSON format:
{
  "welcome": "A friendly, encouraging welcome message for this step",
  "objectives": ["Specific objective 1", "Objective 2", "Objective 3"],
  "checklist": ["Required item 1", "Required item 2"],
  "whyItMatters": "Brief explanation of why this step is important for the claim",
  "commonMistakes": ["Common mistake to avoid 1", "Common mistake 2"],
  "tips": ["Pro tip from Eric Winn's methodology 1", "Tip 2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: 'You are an expert damage assessment coach trained on Eric Winn methodology.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No coaching content generated');
    }

    return JSON.parse(content);

  } catch (error) {
    console.error('Step coaching error:', error);
    throw new Error('Failed to generate coaching content');
  }
}

// Analyze transcript from Limitless Pin recording
export async function parseTranscript(
  rawTranscript: string,
  title: string
): Promise<{
  segments: {
    text: string;
    topic?: string;
    methodologyStep?: WinnMethodologyStep;
    confidence: number;
  }[];
  extractedKnowledge: {
    category: 'procedure' | 'decision_tree' | 'terminology' | 'best_practice' | 'common_mistake';
    title: string;
    content: string;
    suggestedTags: string[];
    suggestedStep: WinnMethodologyStep;
    confidence: number;
  }[];
}> {
  try {
    const prompt = `Parse this damage assessment field training transcript from Eric Winn.

Title: ${title}
Transcript:
${rawTranscript.substring(0, 8000)} ${rawTranscript.length > 8000 ? '... [truncated]' : ''}

Extract and classify the content:

1. Identify key segments and classify their topics
2. Extract actionable knowledge entries that should be added to the knowledge base
3. Map content to relevant Winn Methodology steps: weather_verification, thermal_imaging, terrestrial_walk, test_squares, soft_metals, moisture_testing, core_samples, report_assembly

Return JSON:
{
  "segments": [
    {
      "text": "segment text",
      "topic": "classified topic",
      "methodologyStep": "relevant step or null",
      "confidence": 0-100
    }
  ],
  "extractedKnowledge": [
    {
      "category": "procedure|decision_tree|terminology|best_practice|common_mistake",
      "title": "knowledge entry title",
      "content": "detailed knowledge content",
      "suggestedTags": ["tag1", "tag2"],
      "suggestedStep": "methodology step",
      "confidence": 0-100
    }
  ]
}

Focus on extracting unique insights from Eric's field experience that would help train new inspectors.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing damage assessment training transcripts and extracting structured knowledge.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No transcript analysis generated');
    }

    return JSON.parse(content);

  } catch (error) {
    console.error('Transcript parsing error:', error);
    throw new Error('Failed to parse transcript: ' + (error as Error).message);
  }
}