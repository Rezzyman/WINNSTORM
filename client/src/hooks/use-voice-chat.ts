import { useState, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';

export type VoiceChatState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

interface VoiceChatOptions {
  onTranscription?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
  conversationId?: number;
}

export function useVoiceChat(options: VoiceChatOptions = {}) {
  const [state, setState] = useState<VoiceChatState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        return { 'Authorization': `Bearer ${idToken}` };
      } catch (e) {
        console.warn('Failed to get auth token:', e);
      }
    }
    return {};
  };

  const startRecording = useCallback(async () => {
    try {
      setState('recording');
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setState('error');
      setError('Failed to access microphone. Please check permissions.');
      options.onError?.('Failed to access microphone');
    }
  }, [options]);

  const stopRecording = useCallback(async () => {
    return new Promise<Blob | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const sendVoiceMessage = useCallback(async (imageUrl?: string) => {
    setState('processing');

    const audioBlob = await stopRecording();
    if (!audioBlob || audioBlob.size < 1000) {
      setState('idle');
      setError('Recording too short. Please try again.');
      return null;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      let url = '/api/stormy/voice/chat';
      const params = new URLSearchParams();
      if (options.conversationId) {
        params.append('conversationId', options.conversationId.toString());
      }
      if (imageUrl) {
        params.append('imageUrl', imageUrl);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/octet-stream',
        },
        credentials: 'include',
        body: arrayBuffer,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to process voice message');
      }

      const result = await response.json();
      
      setTranscription(result.transcription);
      setResponse(result.response);
      options.onTranscription?.(result.transcription);
      options.onResponse?.(result.response);

      if (result.audio) {
        await playAudioResponse(result.audio);
      }

      return result;
    } catch (err: any) {
      console.error('Error sending voice message:', err);
      setState('error');
      setError(err.message || 'Failed to process voice message');
      options.onError?.(err.message);
      return null;
    }
  }, [options, stopRecording]);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    setState('speaking');
    
    try {
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setState('idle');
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setState('idle');
          resolve();
        };

        audio.play().catch(() => {
          setState('idle');
          resolve();
        });
      });
    } catch (err) {
      console.error('Error playing audio:', err);
      setState('idle');
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    setState('speaking');
    
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/stormy/voice/speak', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setState('idle');
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setState('idle');
          resolve();
        };

        audio.play().catch(() => {
          setState('idle');
          resolve();
        });
      });
    } catch (err: any) {
      console.error('Error speaking text:', err);
      setState('idle');
      setError(err.message);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setState('idle');
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    setState('idle');
  }, []);

  return {
    state,
    transcription,
    response,
    error,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    isSpeaking: state === 'speaking',
    startRecording,
    stopRecording,
    sendVoiceMessage,
    speakText,
    cancelRecording,
    stopSpeaking,
    playAudioResponse,
  };
}
