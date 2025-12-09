import OpenAI from "openai";

const openai = new OpenAI();

export const STORMY_VOICE = "nova";
export const VOICE_MODEL = "tts-1";
export const VOICE_MODEL_HD = "tts-1-hd";

export async function textToSpeech(
  text: string,
  options: {
    voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    model?: "tts-1" | "tts-1-hd";
    speed?: number;
  } = {}
): Promise<Buffer> {
  const { voice = STORMY_VOICE, model = VOICE_MODEL, speed = 1.0 } = options;

  try {
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error("Text-to-speech error:", error);
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
  const stormyService = await import("./stormy-ai-service");

  const { text: transcription } = await speechToText(audioBuffer, {
    prompt: "This is a damage assessment inspection conversation about roofs, hail damage, thermal imaging, and the Winn Methodology.",
  });

  const attachments = imageUrl
    ? [{ type: "image" as const, url: imageUrl }]
    : undefined;

  const result = await stormyService.sendMessage({
    userId,
    message: transcription,
    conversationId,
    attachments,
    contextType: imageUrl ? "damage" : "general",
  });

  const audioResponseBuffer = await textToSpeech(result.message.content, {
    voice: STORMY_VOICE,
    speed: 1.05,
  });

  return {
    transcription,
    response: result.message.content,
    audioBuffer: audioResponseBuffer,
  };
}

export async function generateStormyGreeting(): Promise<Buffer> {
  const greetings = [
    "Hey there! I'm Stormy, your AI inspection assistant. How can I help you today?",
    "Hi! Stormy here, ready to help with your damage assessment. What are we looking at?",
    "Hello! I'm Stormy. Show me what you're inspecting and I'll help you analyze it.",
  ];
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  return textToSpeech(greeting, { voice: STORMY_VOICE, speed: 1.0 });
}

export async function speakStormyResponse(text: string): Promise<Buffer> {
  const cleanedText = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .substring(0, 4096);

  return textToSpeech(cleanedText, {
    voice: STORMY_VOICE,
    speed: 1.05,
  });
}
