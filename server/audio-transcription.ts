import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface TranscriptionResult {
  transcription: string;
  duration: number;
  status: 'success' | 'fallback' | 'error';
  language?: string;
  segments?: { start: number; end: number; text: string }[];
}

function base64ToBuffer(base64DataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, mimeType };
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mpga': 'mp3',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  };
  return mimeToExt[mimeType] || 'webm';
}

export async function transcribeAudio(audioDataUrl: string, duration: number): Promise<TranscriptionResult> {
  try {
    const { buffer, mimeType } = base64ToBuffer(audioDataUrl);
    const extension = getFileExtension(mimeType);
    const filename = `voice_memo_${Date.now()}.${extension}`;
    
    const file = new File([buffer], filename, { type: mimeType });

    try {
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'verbose_json',
        language: 'en',
      });

      return {
        transcription: response.text || '',
        duration: response.duration || duration,
        status: 'success',
        language: response.language,
        segments: response.segments?.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
      };
    } catch (whisperError: any) {
      console.warn('Whisper API not available via AI Integrations, using fallback:', whisperError.message);
      
      return {
        transcription: `[Voice memo - ${Math.round(duration)} seconds] Automatic transcription is not available. The audio has been saved and can be played back anytime. For field notes, you can manually type your observations or use the notes field.`,
        duration,
        status: 'fallback',
      };
    }
  } catch (error: any) {
    console.error('Transcription error:', error);
    return {
      transcription: '',
      duration,
      status: 'error',
    };
  }
}

export async function summarizeVoiceMemo(transcription: string, step?: string): Promise<string> {
  if (!transcription || transcription.startsWith('[Voice memo')) {
    return transcription;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        {
          role: 'system',
          content: `You are Stormy, the WinnStorm™ AI Assistant. Summarize the following voice memo transcription into clear, professional field notes suitable for a damage assessment report. ${step ? `This is for the "${step}" step of the Winn Methodology.` : ''} Keep the summary concise but include all relevant technical details, measurements, and observations.`
        },
        {
          role: 'user',
          content: transcription
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || transcription;
  } catch (error) {
    console.error('Failed to summarize voice memo:', error);
    return transcription;
  }
}
