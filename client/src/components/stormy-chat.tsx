import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useVoiceChat, VoiceChatState } from '@/hooks/use-voice-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StormyAvatar } from './stormy-avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getStepWelcomeMessage, getQuickActionsForStep, type UserExperienceLevel } from '@/lib/stormy-guidance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Send,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  Cloud,
  Maximize2,
  Minimize2,
  Minus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Thermometer,
  Eye,
  Square
} from 'lucide-react';
import type { AIConversation, AIMessage } from '@shared/schema';

interface StormyChatProps {
  propertyId?: number;
  inspectionId?: number;
  contextType?: 'general' | 'inspection' | 'thermal' | 'damage';
  initialOpen?: boolean;
  position?: 'bottom-right' | 'inline' | 'modal';
  workflowStep?: string;
  workflowData?: any;
  onStepGuidanceRequested?: (step: string) => void;
}

interface MessageAttachment {
  type: 'image' | 'thermal';
  url: string;
  name?: string;
}

type ConversationMessage = AIMessage & {
  processingTime?: number | null;
};

export function StormyChat({
  propertyId,
  inspectionId,
  contextType = 'general',
  initialOpen = false,
  position = 'bottom-right',
  workflowStep,
  workflowData,
  onStepGuidanceRequested
}: StormyChatProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [cameraMode, setCameraMode] = useState(false);
  const [liveImageUrl, setLiveImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevStepRef = useRef<string | undefined>(undefined);
  const [quickActions, setQuickActions] = useState<Array<{label: string; message: string}>>([]);
  const userLevel: UserExperienceLevel = 'intermediate';

  useEffect(() => {
    if (workflowStep && workflowStep !== prevStepRef.current) {
      prevStepRef.current = workflowStep;
      
      const actions = getQuickActionsForStep(workflowStep, userLevel);
      setQuickActions(actions);
      
      const welcomeMessage = getStepWelcomeMessage(workflowStep, userLevel);
      if (welcomeMessage && conversationId) {
        sendMessageMutation.mutate({
          message: `I'm now on the "${workflowStep}" step. ${welcomeMessage}`,
          conversationId: conversationId || undefined,
          propertyId,
          inspectionId,
          contextType
        });
      }
    }
  }, [workflowStep]);

  const handleVoiceResponse = useCallback((text: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations'] });
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations', conversationId] });
    }
  }, [conversationId]);

  const voiceChat = useVoiceChat({
    conversationId: conversationId || undefined,
    onResponse: handleVoiceResponse,
  });

  const { data: conversations, isLoading: loadingConversations } = useQuery<AIConversation[]>({
    queryKey: ['/api/stormy/conversations'],
    enabled: isOpen
  });

  const { data: conversationData, isLoading: loadingMessages } = useQuery<{
    conversation: AIConversation;
    messages: ConversationMessage[];
  }>({
    queryKey: ['/api/stormy/conversations', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/stormy/conversations/${conversationId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversation');
      return response.json();
    },
    enabled: !!conversationId
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      conversationId?: number;
      attachments?: MessageAttachment[];
      propertyId?: number;
      inspectionId?: number;
      contextType?: string;
    }) => {
      return apiRequest('/api/stormy/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: (result) => {
      const newConversationId = result.conversationId || conversationId;
      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations'] });
      if (newConversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations', newConversationId] });
      }
      setMessage('');
      setAttachments([]);
    }
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async (data: {
      imageUrl: string;
      imageType: 'thermal' | 'damage' | 'general';
      additionalContext?: string;
    }) => {
      return apiRequest('/api/stormy/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData?.messages]);

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId: conversationId || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      propertyId,
      inspectionId,
      contextType
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const isThermal = file.name.toLowerCase().includes('thermal') || 
                         file.name.toLowerCase().includes('flir') ||
                         file.name.toLowerCase().includes('ir');
        setAttachments(prev => [...prev, {
          type: isThermal ? 'thermal' : 'image',
          url: base64,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraMode(false);
    setLiveImageUrl(null);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setLiveImageUrl(dataUrl);
    return dataUrl;
  }, []);

  const handleVoiceRecord = useCallback(async () => {
    if (voiceChat.isRecording) {
      let imageUrl: string | undefined;
      if (cameraMode) {
        const captured = captureFrame();
        if (captured) {
          imageUrl = captured;
        }
      }
      await voiceChat.sendVoiceMessage(imageUrl, autoSpeak);
    } else {
      voiceChat.startRecording();
    }
  }, [voiceChat, cameraMode, captureFrame, autoSpeak]);

  const handleSpeakLastResponse = useCallback(async () => {
    const lastMessage = conversationData?.messages?.filter(m => m.role === 'assistant').pop();
    if (lastMessage) {
      await voiceChat.speakText(lastMessage.content);
    }
  }, [conversationData?.messages, voiceChat]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);


  const getVoiceStatusText = () => {
    switch (voiceChat.state) {
      case 'recording': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return voiceModeEnabled ? 'Tap mic to speak' : '';
    }
  };

  const getVoiceStatusColor = () => {
    switch (voiceChat.state) {
      case 'recording': return 'text-red-500';
      case 'processing': return 'text-yellow-500';
      case 'speaking': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  const renderMessage = (msg: ConversationMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        data-testid={`stormy-message-${msg.id}`}
      >
        {isUser ? (
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="text-white text-xs">U</AvatarFallback>
          </Avatar>
        ) : (
          <StormyAvatar size={32} />
        )}
        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
          <div
            className={`rounded-lg p-3 ${
              isUser 
                ? 'bg-primary text-primary-foreground ml-auto' 
                : 'bg-muted'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(msg.attachments as MessageAttachment[]).map((att, i) => (
                  <div key={i} className="relative">
                    <img 
                      src={att.url} 
                      alt={att.name || 'Attachment'} 
                      className="h-16 w-16 rounded object-cover"
                    />
                    {att.type === 'thermal' && (
                      <Badge className="absolute -top-1 -right-1 h-5 px-1 text-[10px]">
                        <Thermometer className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            {new Date(msg.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages, sendMessageMutation.isPending, scrollToBottom]);

  const chatContent = (
    <div className={`flex flex-col ${isMaximized ? 'h-[80vh]' : 'h-[500px]'} overflow-hidden`}>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {!conversationData?.messages?.length && !loadingMessages && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4">
                <StormyAvatar size={64} className="mx-auto" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hi, I'm Stormy!</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {workflowStep 
                  ? `I'm here to guide you through the "${workflowStep}" step using the Winn Methodology. Ask me anything!`
                  : 'Your AI inspection assistant. I can help with thermal analysis, damage assessment, and guide you through the Winn Methodology.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {quickActions.length > 0 ? (
                  quickActions.slice(0, 3).map((action, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-muted text-xs"
                      onClick={() => setMessage(action.message)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> {action.label}
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("What's the Winn Methodology?")}>
                      <Sparkles className="h-3 w-3 mr-1" /> Winn Methodology
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("How do I analyze thermal images?")}>
                      <Thermometer className="h-3 w-3 mr-1" /> Thermal Analysis
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("Help me identify hail damage")}>
                      <Cloud className="h-3 w-3 mr-1" /> Damage Types
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}

          {conversationData?.messages?.map(renderMessage)}

          {sendMessageMutation.isPending && (
            <div className="flex gap-3">
              <StormyAvatar size={32} />
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Stormy is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {cameraMode && (
        <div className="px-4 py-2 border-t bg-black/5">
          <div className="relative rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-32 object-cover"
              data-testid="stormy-camera-preview"
            />
            <canvas ref={canvasRef} className="hidden" />
            {liveImageUrl && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-orange-500">Captured</Badge>
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between">
              <Button
                size="sm"
                variant="secondary"
                onClick={captureFrame}
                data-testid="button-capture-frame"
              >
                <Camera className="h-3 w-3 mr-1" /> Capture
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={stopCamera}
                data-testid="button-stop-camera"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Ask "What am I looking at?" while recording
          </p>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div key={index} className="relative group">
                <img 
                  src={att.url} 
                  alt={att.name || 'Attachment'} 
                  className="h-12 w-12 rounded object-cover border"
                />
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {att.type === 'thermal' && (
                  <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-4 px-1 text-[8px]">
                    IR
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {voiceModeEnabled && voiceChat.state !== 'idle' && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center justify-center gap-2">
            {voiceChat.state === 'recording' && (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className={`text-sm font-medium ${getVoiceStatusColor()}`}>
                  {getVoiceStatusText()}
                </span>
              </span>
            )}
            {voiceChat.state === 'processing' && (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                <span className={`text-sm font-medium ${getVoiceStatusColor()}`}>
                  {getVoiceStatusText()}
                </span>
              </span>
            )}
            {voiceChat.state === 'speaking' && (
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-orange-500 animate-pulse" />
                <span className={`text-sm font-medium ${getVoiceStatusColor()}`}>
                  {getVoiceStatusText()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={voiceChat.stopSpeaking}
                  data-testid="button-stop-speaking"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-t flex-shrink-0">
        {quickActions.length > 0 && conversationData?.messages?.length && (
          <div className="flex flex-wrap gap-1 mb-3">
            {quickActions.slice(0, 3).map((action, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="cursor-pointer hover:bg-muted text-[10px] px-2 py-0.5"
                onClick={() => setMessage(action.message)}
              >
                {action.label}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Switch
              id="voice-mode"
              checked={voiceModeEnabled}
              onCheckedChange={setVoiceModeEnabled}
              data-testid="switch-voice-mode"
            />
            <Label htmlFor="voice-mode" className="text-xs">Voice</Label>
          </div>
          {voiceModeEnabled && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-speak"
                  checked={autoSpeak}
                  onCheckedChange={setAutoSpeak}
                  data-testid="switch-auto-speak"
                />
                <Label htmlFor="auto-speak" className="text-xs">Auto-speak</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={cameraMode ? stopCamera : startCamera}
                data-testid="button-toggle-camera"
              >
                <Eye className="h-3 w-3 mr-1" />
                {cameraMode ? 'Stop' : 'Camera'}
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            data-testid="stormy-file-input"
          />
          
          {!voiceModeEnabled ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending}
                data-testid="button-attach-image"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Stormy anything..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-stormy-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!message.trim() && attachments.length === 0) || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-4">
              <Button
                variant={voiceChat.isRecording ? "destructive" : "default"}
                size="lg"
                className={`h-14 w-14 rounded-full ${voiceChat.isRecording ? 'animate-pulse' : ''}`}
                onClick={handleVoiceRecord}
                disabled={voiceChat.isProcessing || voiceChat.isSpeaking}
                data-testid="button-voice-record"
              >
                {voiceChat.isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : voiceChat.isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              
              {conversationData?.messages?.some(m => m.role === 'assistant') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSpeakLastResponse}
                  disabled={voiceChat.isSpeaking || voiceChat.isProcessing}
                  data-testid="button-speak-last"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (position === 'inline') {
    return (
      <Card className="w-full" data-testid="stormy-chat-inline">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StormyAvatar size={32} />
            Stormy AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {chatContent}
        </CardContent>
      </Card>
    );
  }

  if (position === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="h-12 w-12 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer" data-testid="button-open-stormy-modal">
            <StormyAvatar size={48} />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <StormyAvatar size={32} />
              Stormy AI Coach
            </DialogTitle>
          </DialogHeader>
          {chatContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full overflow-hidden shadow-lg transition-all hover:scale-105 z-50"
          data-testid="button-open-stormy"
        >
          <StormyAvatar size={56} />
          <span className="absolute top-0 right-0 h-3 w-3 bg-orange-500 rounded-full border-2 border-white" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed ${isMaximized ? 'inset-4' : 'bottom-6 right-6 w-96'} bg-background border rounded-lg shadow-2xl z-50 transition-all duration-200`}
          data-testid="stormy-chat-panel"
        >
          <div 
            className={`flex items-center justify-between p-3 border-b bg-gradient-to-r from-orange-500 to-orange-600 ${isMinimized ? 'rounded-lg' : 'rounded-t-lg'} cursor-pointer`}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <StormyAvatar size={32} />
              <div>
                <h3 className="font-semibold text-white text-sm">Stormy</h3>
                <p className="text-xs text-white/80">{isMinimized ? 'Click to expand' : 'AI Inspection Assistant'}</p>
              </div>
            </div>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => {
                  if (isMinimized) {
                    setIsMinimized(false);
                  } else {
                    setIsMinimized(true);
                    setIsMaximized(false);
                  }
                }}
                data-testid="button-toggle-minimize"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </Button>
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setIsMinimized(false);
                  }}
                  data-testid="button-toggle-maximize"
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-stormy"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isMinimized && chatContent}
        </div>
      )}
    </>
  );
}