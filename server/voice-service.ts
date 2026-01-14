import OpenAI from "openai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const openai = new OpenAI();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Voice: Jedidiah - confident, authoritative male voice
// Personality: Calm, professional, dryly clever
export const STORMY_VOICE_ID = "Cb8NLd0sUB8jI4MW2f9M";

// Use flash model for fastest response times
export const ELEVEN_LABS_MODEL = "eleven_flash_v2_5";

// Minimal voice prompt for fast responses
const VOICE_SYSTEM_PROMPT = `You are Stormy, a confident roof damage expert. Keep responses under 2 sentences. Be direct, professional, and brief. No markdown.`;

// Voice settings tuned for Stormy's confident, calm demeanor
export const STORMY_VOICE_SETTINGS = {
  stability: 0.65,        // Higher = more consistent, calm delivery
  similarityBoost: 0.70,  // Balanced for natural but authoritative tone
};

export async function textToSpeech(
  text: string,
  options: {
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
  } = {}
): Promise<Buffer> {
  const {
    voiceId = STORMY_VOICE_ID,
    stability = STORMY_VOICE_SETTINGS.stability,
    similarityBoost = STORMY_VOICE_SETTINGS.similarityBoost,
  } = options;

  try {
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: ELEVEN_LABS_MODEL,
      voiceSettings: {
        stability,
        similarityBoost,
      },
    });

    const chunks: Buffer[] = [];
    const reader = audio.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error("Eleven Labs text-to-speech error:", error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

export async function speechToText(
  audioBuffer: Buffer,
  options: {
    language?: string;
    prompt?: string;
  } = {}
): Promise<{ text: string; language?: string }> {
  const { language, prompt } = options;

  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language,
      prompt,
      response_format: "json",
    });

    return {
      text: transcription.text,
    };
  } catch (error: any) {
    console.error("Speech-to-text error:", error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

export async function processVoiceMessage(
  audioBuffer: Buffer,
  userId: string,
  conversationId?: number,
  imageUrl?: string
): Promise<{
  transcription: string;
  response: string;
  audioBuffer: Buffer;
}> {
  // Fast path: Direct OpenAI call with minimal prompt (skips DB, memory, etc.)
  const { text: transcription } = await speechToText(audioBuffer, {
    prompt: "Roof damage, hail, thermal imaging, Winn Methodology.",
  });

  // Build messages for fast response
  const messages: Array<{role: "system" | "user"; content: any}> = [
    { role: "system", content: VOICE_SYSTEM_PROMPT },
  ];

  // If image provided, include it
  if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: transcription },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    });
  } else {
    messages.push({ role: "user", content: transcription });
  }

  // Direct OpenAI call - fastest path
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages as any,
    max_tokens: 150, // Very short responses for voice
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || "I didn't catch that. Try again.";

  // Generate speech
  const audioResponseBuffer = await textToSpeech(response);

  return {
    transcription,
    response,
    audioBuffer: audioResponseBuffer,
  };
}

export async function generateStormyGreeting(): Promise<Buffer> {
  // Greetings match Stormy's personality: confident, brief, dryly professional
  const greetings = [
    "Stormy here. What are we looking at?",
    "Ready when you are. Show me the damage.",
    "Stormy. Let's get to work.",
    "What have you got for me?",
    "Alright, walk me through it.",
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  return textToSpeech(greeting);
}

export async function speakStormyResponse(text: string): Promise<Buffer> {
  const cleanedText = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .substring(0, 4096);

  return textToSpeech(cleanedText);
}

export async function getAvailableVoices() {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.voices?.map(v => ({
      voiceId: v.voiceId,
      name: v.name,
      category: v.category,
      description: v.description,
    })) || [];
  } catch (error: any) {
    console.error("Failed to fetch voices:", error);
    return [];
  }
}
