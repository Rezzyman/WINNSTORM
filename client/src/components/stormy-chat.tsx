import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Mic,
  Thermometer
} from 'lucide-react';
import type { AIConversation, AIMessage } from '@shared/schema';

interface StormyChatProps {
  propertyId?: number;
  inspectionId?: number;
  contextType?: 'general' | 'inspection' | 'thermal' | 'damage';
  initialOpen?: boolean;
  position?: 'bottom-right' | 'inline' | 'modal';
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
  position = 'bottom-right'
}: StormyChatProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMaximized, setIsMaximized] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useQuery<AIConversation[]>({
    queryKey: ['/api/stormy/conversations'],
    enabled: isOpen
  });

  const { data: conversationData, isLoading: loadingMessages } = useQuery<{
    conversation: AIConversation;
    messages: ConversationMessage[];
  }>({
    queryKey: ['/api/stormy/conversations', conversationId],
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
      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/stormy/conversations', conversationId] });
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

  const renderMessage = (msg: ConversationMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        data-testid={`stormy-message-${msg.id}`}
      >
        <Avatar className={`h-8 w-8 ${isUser ? 'bg-primary' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
          <AvatarFallback className="text-white text-xs">
            {isUser ? 'U' : <Cloud className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
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

  const chatContent = (
    <div className={`flex flex-col ${isMaximized ? 'h-[80vh]' : 'h-[400px]'}`}>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {!conversationData?.messages?.length && !loadingMessages && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hi, I'm Stormy!</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your AI inspection assistant. I can help with thermal analysis, 
                damage assessment, and guide you through the Winn Methodology.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("What's the Winn Methodology?")}>
                  <Sparkles className="h-3 w-3 mr-1" /> Winn Methodology
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("How do I analyze thermal images?")}>
                  <Thermometer className="h-3 w-3 mr-1" /> Thermal Analysis
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setMessage("Help me identify hail damage")}>
                  <Cloud className="h-3 w-3 mr-1" /> Damage Types
                </Badge>
              </div>
            </div>
          )}

          {conversationData?.messages?.map(renderMessage)}

          {sendMessageMutation.isPending && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600">
                <AvatarFallback className="text-white">
                  <Cloud className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Stormy is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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

      <div className="p-4 border-t">
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
        </div>
      </div>
    </div>
  );

  if (position === 'inline') {
    return (
      <Card className="w-full" data-testid="stormy-chat-inline">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            Stormy AI Assistant
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
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
            data-testid="button-open-stormy-modal"
          >
            <Cloud className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Cloud className="h-4 w-4 text-white" />
              </div>
              Stormy AI Assistant
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
          data-testid="button-open-stormy"
        >
          <Cloud className="h-7 w-7 text-white" />
          <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed ${isMaximized ? 'inset-4' : 'bottom-6 right-6 w-96'} bg-background border rounded-lg shadow-2xl z-50 transition-all duration-200`}
          data-testid="stormy-chat-panel"
        >
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Cloud className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Stormy</h3>
                <p className="text-xs text-white/80">AI Inspection Assistant</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMaximized(!isMaximized)}
                data-testid="button-toggle-maximize"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-stormy"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {chatContent}
        </div>
      )}
    </>
  );
}