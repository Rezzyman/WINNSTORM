import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIAssistantRequest {
  message: string;
  context: string;
  conversationHistory?: any[];
  attachments?: string[];
}

export interface AIAssistantResponse {
  response: string;
  suggestions?: string[];
  actionable_items?: string[];
}

export async function getAIAssistance(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  try {
    const systemPrompt = `${request.context}

You are the WinnStorm™ AI Assistant, an expert in damage assessment consulting based on Eric Winn's proven methodology. You have deep expertise in:

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
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent, professional responses
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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert damage assessment consultant trained on Eric Winn\'s methodology. Provide detailed technical analysis based on inspection data.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.2,
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