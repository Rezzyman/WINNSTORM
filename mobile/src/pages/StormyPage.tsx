import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, Loader2, ChevronDown } from 'lucide-react';
import { cn, hapticFeedback } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function StormyPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey there! I'm Stormy, your AI inspection assistant. How can I help you today? You can ask me about damage assessment, the Winn methodology, or get help with your current inspection.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/stormy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || "I couldn't process that. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      hapticFeedback('light');

      // Speak the response
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const playAudio = async (url: string) => {
    try {
      setIsSpeaking(true);
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        // Transcribe audio
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await fetch('/api/stormy/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              sendMessage(data.text);
            }
          }
        } catch (err) {
          console.error('Transcription error:', err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      hapticFeedback('heavy');
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      hapticFeedback('medium');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 pt-safe">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl overflow-hidden">
              <img src="/stormy-avatar.png" alt="Stormy" className="w-full h-full object-cover" />
            </div>
            <div className={cn(
              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900',
              isLoading ? 'bg-amber-500' : isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            )} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Stormy AI</h1>
            <p className="text-slate-400 text-sm">
              {isLoading ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Online'}
            </p>
          </div>
          {isSpeaking && (
            <Volume2 className="w-6 h-6 text-blue-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-3xl px-5 py-3',
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-lg'
                  : 'bg-slate-800 text-slate-100 rounded-bl-lg'
              )}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-3xl rounded-bl-lg px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            'How do I identify hail damage?',
            'Explain the Winn Methodology',
            'What photos do I need?',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                hapticFeedback('light');
                sendMessage(suggestion);
              }}
              className="flex-shrink-0 bg-slate-800 text-slate-300 text-sm px-4 py-2 rounded-full border border-slate-700 active:bg-slate-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-safe border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSubmit} className="py-3">
          <div className="flex items-end gap-3">
            {/* Voice Record Button */}
            <button
              type="button"
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
                isRecording
                  ? 'bg-red-500 scale-110 animate-pulse-ring'
                  : 'bg-slate-800 border border-slate-700'
              )}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-slate-400" />
              )}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? 'Recording...' : 'Type a message...'}
                disabled={isRecording || isLoading}
                className={cn(
                  'w-full bg-slate-800 text-white placeholder-slate-500 rounded-2xl',
                  'px-5 py-4 pr-14 text-[16px] border border-slate-700',
                  'focus:outline-none focus:border-primary-500 transition-colors',
                  (isRecording || isLoading) && 'opacity-50'
                )}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  inputText.trim()
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-700 text-slate-500'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isRecording && (
            <p className="text-center text-red-400 text-sm mt-2 animate-pulse">
              Hold to record • Release to send
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
