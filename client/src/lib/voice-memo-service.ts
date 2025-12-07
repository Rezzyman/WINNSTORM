import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface VoiceMemo {
  id: string;
  dataUrl: string;
  filePath?: string;
  duration: number;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  transcription?: string;
  isTranscribing: boolean;
}

class VoiceMemoService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private recordingStartTime: number = 0;
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    if (this.isRecording) return false;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permissions not granted');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<VoiceMemo | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        const audioBlob = new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
        const dataUrl = await this.blobToDataUrl(audioBlob);

        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
          const position = await this.getLocation();
          latitude = position.latitude;
          longitude = position.longitude;
        } catch (error) {
          console.warn('Failed to get location for voice memo:', error);
        }

        const voiceMemo: VoiceMemo = {
          id: this.generateId(),
          dataUrl,
          duration,
          timestamp: new Date().toISOString(),
          latitude,
          longitude,
          isTranscribing: false,
        };

        if (this.isNative) {
          voiceMemo.filePath = await this.saveToFileSystem(voiceMemo);
        }

        this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        resolve(voiceMemo);
      };

      this.mediaRecorder!.stop();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  async transcribeAudio(voiceMemo: VoiceMemo, step?: string): Promise<{
    transcription: string;
    rawTranscription?: string;
    status: 'success' | 'fallback' | 'error';
  }> {
    try {
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          audioDataUrl: voiceMemo.dataUrl,
          duration: voiceMemo.duration,
          step,
        }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      return {
        transcription: result.transcription || '',
        rawTranscription: result.rawTranscription,
        status: result.status || 'error',
      };
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      return {
        transcription: '',
        status: 'error',
      };
    }
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'audio/webm';
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async saveToFileSystem(memo: VoiceMemo): Promise<string> {
    try {
      const filename = `winnstorm_voice_${memo.id}.webm`;
      const base64Data = memo.dataUrl.split(',')[1];

      await Filesystem.writeFile({
        path: `WinnStorm/VoiceMemos/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      return `WinnStorm/VoiceMemos/${filename}`;
    } catch (error) {
      console.error('Failed to save voice memo:', error);
      return '';
    }
  }

  private async getLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAudioFromPath(filePath: string): Promise<string | null> {
    if (!this.isNative || !filePath) return null;

    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Documents,
      });

      return `data:audio/webm;base64,${result.data}`;
    } catch (error) {
      console.error('Failed to read voice memo from path:', error);
      return null;
    }
  }

  async deleteMemo(filePath: string): Promise<boolean> {
    if (!this.isNative || !filePath) return true;

    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.Documents,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete voice memo:', error);
      return false;
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const voiceMemoService = new VoiceMemoService();
