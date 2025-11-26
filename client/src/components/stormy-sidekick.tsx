import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiRequestRaw, apiRequest } from '@/lib/queryClient';
import { WinnMethodologyStep } from '@shared/schema';
import { 
  MessageCircle, X, Send, Sparkles, HelpCircle, BookOpen, 
  CheckCircle2, AlertTriangle, ChevronUp, ChevronDown, Loader2,
  GraduationCap, Lightbulb, Target, Bot
} from 'lucide-react';
import stormyAvatar from '@assets/ChatGPT Image Jul 31, 2025, 03_42_36 PM_1753998186905.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StormySidekickProps {
  currentStep?: WinnMethodologyStep | null;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  propertyId?: number | null;
  sessionId?: number | null;
  evidenceCount?: number;
  onLevelChange?: (level: 'beginner' | 'intermediate' | 'expert') => void;
  isFloating?: boolean;
  className?: string;
}

const STEP_QUICK_QUESTIONS: Record<WinnMethodologyStep, string[]> = {
  weather_verification: [
    "What weather data sources should I check?",
    "How do I verify a hail event date?",
    "What size hail causes significant damage?"
  ],
  thermal_imaging: [
    "What temperature anomalies indicate damage?",
    "How do I interpret thermal patterns?",
    "When is the best time for thermal scans?"
  ],
  terrestrial_walk: [
    "What ground-level damage should I document?",
    "How do I identify soft metal damage?",
    "What photos are essential from ground level?"
  ],
  test_squares: [
    "How large should test squares be?",
    "How many impacts indicate significant damage?",
    "Where should I place test squares?"
  ],
  soft_metals: [
    "What qualifies as soft metal damage?",
    "How do I photograph dents properly?",
    "What's the significance of soft metal patterns?"
  ],
  moisture_testing: [
    "What moisture levels indicate problems?",
    "Where should I take moisture readings?",
    "How often should I calibrate the meter?"
  ],
  core_samples: [
    "When are core samples necessary?",
    "How do I extract samples safely?",
    "What should I look for in core samples?"
  ],
  report_assembly: [
    "What sections are required in the report?",
    "How do I organize the evidence?",
    "What conclusions should I include?"
  ]
};

export function StormySidekick({
  currentStep,
  experienceLevel = 'beginner',
  propertyId,
  sessionId,
  evidenceCount = 0,
  onLevelChange,
  isFloating = true,
  className = ''
}: StormySidekickProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  interface CoachingContent {
    welcome: string;
    objectives: string[];
    checklist: string[];
    whyItMatters: string;
    commonMistakes: string[];
    tips: string[];
  }

  const { data: coaching, isLoading: isLoadingCoaching } = useQuery<CoachingContent | null>({
    queryKey: ['/api/inspection/coaching', currentStep, experienceLevel],
    queryFn: async (): Promise<CoachingContent | null> => {
      if (!currentStep) return null;
      const response = await apiRequestRaw(
        'GET',
        `/api/inspection/coaching?step=${currentStep}&level=${experienceLevel}`
      );
      return response.json();
    },
    enabled: !!currentStep
  });

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const context = {
        currentStep,
        experienceLevel,
        propertyId,
        sessionId,
        evidenceCount,
        recentMessages: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content
        }))
      };
      
      const response = await apiRequestRaw('POST', '/api/ai/chat', {
        message: userMessage,
        context
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = (text?: string) => {
    const messageText = text || message.trim();
    if (!messageText) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setShowQuickQuestions(false);
    chatMutation.mutate(messageText);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  if (!isFloating) {
    return (
      <Card className={`border-primary/30 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="relative">
              <img 
                src={stormyAvatar} 
                alt="Stormy" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            Stormy's Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCoaching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : coaching ? (
            <div className="space-y-4">
              <p className="text-sm">{coaching.welcome}</p>
              
              {coaching.objectives.length > 0 && (
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    Objectives
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    {coaching.objectives.map((obj, i) => (
                      <li key={i} className="list-disc">{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {coaching.whyItMatters && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Why This Matters
                  </p>
                  <p className="text-sm text-muted-foreground">{coaching.whyItMatters}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start an inspection to get personalized guidance from Stormy!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
          data-testid="button-stormy-chat"
        >
          <div className="relative">
            <img 
              src={stormyAvatar} 
              alt="Stormy" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
              <MessageCircle className="h-2 w-2 text-white" />
            </div>
          </div>
        </Button>
      )}

      {isOpen && (
        <Card 
          className="fixed bottom-24 right-4 z-50 w-[90vw] max-w-[380px] shadow-2xl border-primary/30 flex flex-col max-h-[70vh]"
          data-testid="stormy-chat-panel"
        >
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="relative">
                  <img 
                    src={stormyAvatar} 
                    alt="Stormy" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                Stormy
              </CardTitle>
              <div className="flex items-center gap-2">
                {onLevelChange && (
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      const levels: ('beginner' | 'intermediate' | 'expert')[] = ['beginner', 'intermediate', 'expert'];
                      const currentIndex = levels.indexOf(experienceLevel);
                      const nextLevel = levels[(currentIndex + 1) % 3];
                      onLevelChange(nextLevel);
                    }}
                    data-testid="badge-experience-level"
                  >
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {experienceLevel}
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                  data-testid="button-close-chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {currentStep && (
              <p className="text-xs text-muted-foreground mt-1">
                Helping with: {currentStep.replace(/_/g, ' ')}
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {messages.length === 0 && coaching && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <img 
                          src={stormyAvatar} 
                          alt="Stormy" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-sm max-w-[85%]">
                        <p>{coaching.welcome}</p>
                        {coaching.tips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {coaching.tips.slice(0, 2).map((tip, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Lightbulb className="h-2 w-2 mr-1" />
                                {tip}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <img 
                          src={stormyAvatar} 
                          alt="Stormy" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div 
                      className={`rounded-lg p-3 text-sm max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={stormyAvatar} 
                        alt="Stormy" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {showQuickQuestions && currentStep && STEP_QUICK_QUESTIONS[currentStep] && messages.length < 2 && (
              <div className="px-4 pb-2 flex-shrink-0">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Quick Questions
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {STEP_QUICK_QUESTIONS[currentStep].map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1 px-2"
                          onClick={() => handleQuickQuestion(q)}
                          data-testid={`quick-question-${i}`}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            <div className="p-4 border-t flex-shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask Stormy anything..."
                  className="flex-1"
                  disabled={chatMutation.isPending}
                  data-testid="input-stormy-message"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={chatMutation.isPending || !message.trim()}
                  className="bg-gradient-to-r from-primary to-cyan-500"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
