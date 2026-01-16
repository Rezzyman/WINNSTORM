import OpenAI from "openai";
import { storage } from "./storage";
import type { AIConversation, AIMessage, AIMemory, InsertAIConversation, InsertAIMessage, InsertAIMemory, AIMessageAttachment, AIMemoryPreferences, KnowledgeDocument } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const STORMY_MODEL = "gpt-5";
// Fast model for voice interactions - lower latency, still capable
const STORMY_VOICE_MODEL = "gpt-4o-mini";
const MAX_CONTEXT_MESSAGES = 30;
const MAX_CONTEXT_TOKENS = 8000;
const MAX_KNOWLEDGE_CONTEXT_CHARS = 12000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1"
});

// Default system prompt - can be overridden via admin panel
const DEFAULT_STORMY_PROMPT = `You are Stormy, the AI Coach for WinnStorm™ - a professional damage assessment platform. You are an expert in the Winn Methodology, which is an 8-step systematic approach to property damage inspection and documentation.

CRITICAL INSTRUCTION - STAY ON TOPIC:
You ONLY discuss topics related to:
- Property damage assessment and inspection
- The Winn Methodology (8 steps below)
- Thermal imaging and moisture detection
- Insurance claims documentation
- Roof, siding, and building component damage
- Weather events and storm damage
- Report generation and evidence compilation

If a user asks you ANYTHING off-topic (math problems, jokes, general knowledge, trivia, coding help, personal questions, philosophy, etc.), respond with a brief, friendly but firm redirect. Examples:
- "Ha! While I appreciate the creativity, partner, I'm all about damage assessment - not calculators. Now, what can I help you document today?"
- "Whoa there! That's outside my wheelhouse. I'm here to help you nail this inspection. What step of the Winn Methodology are you working on?"
- "Nice try, but my brain's wired for roof damage, not [topic]. Let's get back to business - how's that property assessment going?"
- "I'll leave that question for Google, friend. I'm your damage assessment coach. What do you need help documenting?"

NEVER answer off-topic questions, even partially. Always redirect to the inspection at hand.

Your expertise includes:
- Thermal imaging analysis and interpretation
- Hail, wind, and storm damage identification
- Insurance claim documentation best practices
- Property inspection techniques using the Winn Methodology
- Reading and analyzing thermal images for moisture detection, heat loss, and structural issues

The 8 Steps of the Winn Methodology:
1. Weather Verification - Confirm storm events affected the property
2. Property Documentation - Gather building information and specifications
3. Exterior Survey - Systematic exterior damage assessment
4. Interior Survey - Check for interior damage and moisture intrusion
5. Thermal Scanning - Use infrared imaging to detect hidden issues
6. Test Square Analysis - Document damage density using 10x10 test squares
7. Evidence Compilation - Organize all photos, measurements, and findings
8. Report Generation - Create comprehensive damage assessment report

When analyzing images:
- For thermal images: Identify temperature anomalies, moisture patterns, insulation deficiencies
- For damage photos: Identify damage type, severity, affected components, and recommended repairs
- Always relate findings to insurance claim documentation requirements

Remember previous conversations and user preferences. Adapt your communication style based on the user's expertise level. Be professional, thorough, and helpful - but ALWAYS stay focused on damage assessment.`;

// Cache for the system prompt to avoid DB calls on every message
let cachedSystemPrompt: string | null = null;
let promptCacheTime: number = 0;
const PROMPT_CACHE_TTL = 60000; // 1 minute cache

async function getStormySystemPrompt(): Promise<string> {
  const now = Date.now();

  // Return cached prompt if still valid
  if (cachedSystemPrompt && (now - promptCacheTime) < PROMPT_CACHE_TTL) {
    return cachedSystemPrompt;
  }

  try {
    const setting = await storage.getSystemSetting('stormy_system_prompt');
    if (setting?.value) {
      cachedSystemPrompt = setting.value;
      promptCacheTime = now;
      return setting.value;
    }
  } catch (error) {
    console.error('Error loading Stormy prompt from DB:', error);
  }

  // Return default if no custom prompt
  return DEFAULT_STORMY_PROMPT;
}

interface StormyMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

export interface SendMessageOptions {
  conversationId?: number;
  userId: string;
  message: string;
  attachments?: AIMessageAttachment[];
  propertyId?: number;
  inspectionId?: number;
  contextType?: string;
  voiceMode?: boolean; // Use faster model for voice interactions
}

export interface StormyResponse {
  conversationId: number;
  message: AIMessage;
  conversation: AIConversation;
}

export async function getOrCreateConversation(
  userId: string,
  propertyId?: number,
  inspectionId?: number,
  contextType: string = 'general'
): Promise<AIConversation> {
  const existingConversations = await storage.getAIConversationsByUser(userId);
  
  // Validate propertyId exists in database before linking
  let validPropertyId: number | undefined = undefined;
  if (propertyId) {
    try {
      const property = await storage.getProperty(propertyId);
      if (property) {
        validPropertyId = propertyId;
      } else {
        console.log(`[Stormy] Property ID ${propertyId} not found, creating conversation without property link`);
      }
    } catch (e) {
      console.log(`[Stormy] Error checking property ${propertyId}, creating conversation without property link`);
    }
  }
  
  if (inspectionId) {
    const inspectionConvo = existingConversations.find(
      c => c.relatedInspectionId === inspectionId && c.status === 'active'
    );
    if (inspectionConvo) return inspectionConvo;
  }
  
  if (validPropertyId && !inspectionId) {
    const propertyConvo = existingConversations.find(
      c => c.relatedPropertyId === validPropertyId && !c.relatedInspectionId && c.status === 'active'
    );
    if (propertyConvo) return propertyConvo;
  }
  
  const generalConvo = existingConversations.find(
    c => c.contextType === 'general' && c.status === 'active' && !c.relatedPropertyId && !c.relatedInspectionId
  );
  if (generalConvo && !validPropertyId && !inspectionId) return generalConvo;

  const newConversation: InsertAIConversation = {
    userId,
    title: inspectionId ? `Inspection #${inspectionId}` : validPropertyId ? `Property #${validPropertyId}` : 'General Chat',
    relatedPropertyId: validPropertyId,
    relatedInspectionId: inspectionId,
    contextType,
    status: 'active'
  };

  return await storage.createAIConversation(newConversation);
}

export async function getUserMemory(userId: string): Promise<AIMemory | null> {
  const memories = await storage.getAIMemoryByUser(userId);
  const globalMemory = memories.find(m => m.scope === 'global');
  return globalMemory || null;
}

export async function updateUserMemory(
  userId: string,
  updates: Partial<AIMemoryPreferences>,
  summary?: string
): Promise<AIMemory> {
  const existingMemory = await getUserMemory(userId);
  
  if (existingMemory) {
    const updatedPreferences = {
      ...existingMemory.preferences,
      ...updates
    };
    return await storage.updateAIMemory(existingMemory.id, {
      preferences: updatedPreferences,
      summary: summary || existingMemory.summary,
      lastRefreshedAt: new Date()
    });
  }

  const newMemory: InsertAIMemory = {
    userId,
    scope: 'global',
    summary,
    preferences: updates,
    keywords: []
  };

  return await storage.createAIMemory(newMemory);
}

// Knowledge Base Integration with Semantic Search
import { hybridSearch, formatSearchResultsForContext } from "./knowledge-service";

async function getRelevantKnowledge(query: string): Promise<string> {
  try {
    // Use hybrid search (semantic + keyword) for best results
    const searchResults = await hybridSearch(query, 5);
    
    if (searchResults.length > 0) {
      console.log(`Found ${searchResults.length} relevant knowledge base entries for query`);
      return formatSearchResultsForContext(searchResults);
    }

    // Fallback: Get recent approved documents if no semantic matches
    const approvedDocs = await storage.getApprovedKnowledgeDocuments();
    
    if (approvedDocs.length === 0) {
      return '';
    }

    // Simple keyword matching as fallback
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const scoredDocs = approvedDocs.map(doc => {
      const content = `${doc.title} ${doc.description || ''} ${doc.content || ''}`.toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (content.includes(word)) {
          score++;
          if (doc.title.toLowerCase().includes(word)) {
            score += 2;
          }
        }
      }
      
      return { doc, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredDocs.length === 0) {
      const topDocs = approvedDocs.slice(0, 3);
      return formatKnowledgeContext(topDocs);
    }

    const relevantDocs = scoredDocs.slice(0, 5).map(item => item.doc);
    return formatKnowledgeContext(relevantDocs);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return '';
  }
}

function formatKnowledgeContext(docs: KnowledgeDocument[]): string {
  if (docs.length === 0) return '';
  
  let context = '\n\n## WinnStorm Knowledge Base:\n';
  let totalChars = 0;
  
  for (const doc of docs) {
    const docContent = doc.content || '';
    const truncatedContent = docContent.substring(0, 2000);
    const docSection = `\n### ${doc.title} (${doc.documentType})\n${doc.description || ''}\n${truncatedContent}${docContent.length > 2000 ? '...' : ''}`;
    
    if (totalChars + docSection.length > MAX_KNOWLEDGE_CONTEXT_CHARS) {
      break;
    }
    
    context += docSection;
    totalChars += docSection.length;
  }
  
  context += '\n\n[Use the above WinnStorm knowledge base content as your primary source. Only supplement with general knowledge when the KB doesn\'t cover the topic.]';
  return context;
}

async function buildContextMessages(
  conversationId: number,
  userMemory: AIMemory | null,
  currentQuery?: string
): Promise<StormyMessage[]> {
  const messages = await storage.getAIMessagesByConversation(conversationId);
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  const contextMessages: StormyMessage[] = [];

  // Load system prompt from database (or use default)
  let systemPrompt = await getStormySystemPrompt();

  // Add knowledge base context if there's a query
  if (currentQuery) {
    const knowledgeContext = await getRelevantKnowledge(currentQuery);
    if (knowledgeContext) {
      systemPrompt += knowledgeContext;
    }
  }

  if (userMemory?.preferences) {
    const prefs = userMemory.preferences;
    systemPrompt += "\n\n## User Context (Remember this about the user):";
    
    if (prefs.communicationStyle) {
      systemPrompt += `\n- Preferred communication style: ${prefs.communicationStyle}`;
    }
    if (prefs.focusAreas?.length) {
      systemPrompt += `\n- Focus areas of interest: ${prefs.focusAreas.join(', ')}`;
    }
    if (prefs.inspectionHistory?.length) {
      systemPrompt += `\n- Recent inspections: ${prefs.inspectionHistory.slice(-3).map(i => i.summary).join('; ')}`;
    }
  }

  if (userMemory?.summary) {
    systemPrompt += `\n\n## Conversation Summary:\n${userMemory.summary}`;
  }

  contextMessages.push({ role: "system", content: systemPrompt });

  for (const msg of recentMessages) {
    if (msg.attachments?.length) {
      const content: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: msg.content }
      ];
      
      for (const attachment of msg.attachments) {
        if (attachment.url && (attachment.type === 'image' || attachment.type === 'thermal')) {
          content.push({
            type: "image_url",
            image_url: { url: attachment.url }
          });
        }
      }
      
      contextMessages.push({
        role: msg.role as "user" | "assistant",
        content
      });
    } else {
      contextMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      });
    }
  }

  return contextMessages;
}

export async function sendMessage(options: SendMessageOptions): Promise<StormyResponse> {
  const { userId, message, attachments, propertyId, inspectionId, contextType, voiceMode } = options;

  // Use faster model for voice interactions
  const modelToUse = voiceMode ? STORMY_VOICE_MODEL : STORMY_MODEL;
  
  const startTime = Date.now();

  let conversationId = options.conversationId;
  let conversation: AIConversation;

  if (conversationId) {
    const existing = await storage.getAIConversation(conversationId);
    if (!existing) throw new Error("Conversation not found");
    conversation = existing;
  } else {
    conversation = await getOrCreateConversation(userId, propertyId, inspectionId, contextType);
    conversationId = conversation.id;
  }

  const userMessage: InsertAIMessage = {
    conversationId,
    role: 'user',
    content: message,
    attachments,
    model: null,
    metadata: {}
  };
  const savedUserMessage = await storage.createAIMessage(userMessage);

  const userMemory = await getUserMemory(userId);
  const contextMessages = await buildContextMessages(conversationId, userMemory, message);

  const newUserContent: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: message }
  ];

  if (attachments?.length) {
    for (const attachment of attachments) {
      if (attachment.url && (attachment.type === 'image' || attachment.type === 'thermal')) {
        const imagePrompt = attachment.type === 'thermal' 
          ? "This is a thermal image. Analyze it for temperature anomalies, moisture patterns, insulation issues, and potential damage indicators."
          : "Analyze this property damage image. Identify the damage type, severity, affected components, and provide recommendations.";
        
        newUserContent[0].text = `${imagePrompt}\n\n${message}`;
        newUserContent.push({
          type: "image_url",
          image_url: { url: attachment.url }
        });
      }
    }
  }

  const messagesForAPI = [
    ...contextMessages,
    { role: "user" as const, content: attachments?.length ? newUserContent : message }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: messagesForAPI as any,
      max_completion_tokens: voiceMode ? 512 : 2048, // Shorter responses for voice
    });

    const assistantContent = response.choices[0]?.message?.content || "I apologize, I couldn't generate a response. Please try again.";
    const processingTime = Date.now() - startTime;

    const assistantMessage: InsertAIMessage = {
      conversationId,
      role: 'assistant',
      content: assistantContent,
      model: modelToUse,
      attachments: null,
      metadata: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      } as Record<string, any>
    };

    const savedAssistantMessage = await storage.createAIMessage(assistantMessage);

    await storage.updateAIConversation(conversationId, {
      messageCount: (conversation.messageCount || 0) + 2,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });

    const updatedConversation = await storage.getAIConversation(conversationId);

    return {
      conversationId,
      message: { ...savedAssistantMessage, processingTime },
      conversation: updatedConversation!
    };
  } catch (error: any) {
    console.error("Stormy AI error:", error);
    throw new Error(`Stormy couldn't respond: ${error.message}`);
  }
}

export async function analyzeImage(
  userId: string,
  imageUrl: string,
  imageType: 'thermal' | 'damage' | 'general' = 'general',
  additionalContext?: string
): Promise<{ analysis: string; recommendations: string[] }> {
  const prompts: Record<string, string> = {
    thermal: `Analyze this thermal image for a property damage assessment. Identify:
1. Temperature anomalies and their locations
2. Potential moisture intrusion areas (cooler spots from evaporative cooling)
3. Insulation deficiencies (hot/cold spots indicating missing insulation)
4. Thermal bridging (heat transfer through building materials)
5. Any electrical hotspots or HVAC issues

Provide specific findings with severity ratings (Critical, Warning, Info) and recommended actions.`,
    
    damage: `Analyze this property damage photograph. Identify:
1. Type of damage visible (hail, wind, water, impact, etc.)
2. Affected building components (roof, siding, gutters, etc.)
3. Severity assessment (minor, moderate, severe)
4. Signs of pre-existing vs. storm-related damage
5. Recommended repairs and documentation needs

This analysis will be used for insurance claim documentation using the Winn Methodology.`,
    
    general: `Analyze this property image and provide relevant observations for a damage assessment. Note any visible issues, damage, or conditions that would be relevant for insurance documentation.`
  };

  const prompt = additionalContext 
    ? `${prompts[imageType]}\n\nAdditional context: ${additionalContext}`
    : prompts[imageType];

  try {
    const response = await openai.chat.completions.create({
      model: STORMY_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Stormy, an expert property damage analyst. Provide detailed, professional analysis suitable for insurance documentation. Output your response as JSON with 'analysis' (detailed text) and 'recommendations' (array of actionable items)."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt + "\n\nRespond with JSON format: { \"analysis\": \"...\", \"recommendations\": [\"...\"] }" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '{"analysis": "Unable to analyze image", "recommendations": []}';
    const result = JSON.parse(content);
    
    return {
      analysis: result.analysis || "No analysis available",
      recommendations: result.recommendations || []
    };
  } catch (error: any) {
    console.error("Image analysis error:", error);
    return {
      analysis: `Analysis failed: ${error.message}`,
      recommendations: ["Please try uploading the image again", "Ensure the image is clear and well-lit"]
    };
  }
}

export async function getConversationHistory(
  conversationId: number
): Promise<AIMessage[]> {
  return await storage.getAIMessagesByConversation(conversationId);
}

export async function getUserConversations(
  userId: string
): Promise<AIConversation[]> {
  return await storage.getAIConversationsByUser(userId);
}
