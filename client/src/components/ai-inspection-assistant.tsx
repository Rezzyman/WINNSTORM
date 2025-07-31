import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Send, Image, MapPin, Thermometer, Camera, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StormyAvatar } from './stormy-avatar';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
  attachments?: string[];
}

interface AIInspectionAssistantProps {
  currentStep?: string;
  propertyData?: any;
  thermalData?: any;
  roofSections?: any[];
  onGuidanceReceived?: (guidance: string) => void;
}

export function AIInspectionAssistant({
  currentStep,
  propertyData,
  thermalData,
  roofSections,
  onGuidanceReceived
}: AIInspectionAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Stormy, your WinnStorm™ AI Assistant, trained on Eric Winn's methodology for comprehensive damage assessment. I can help guide you through inspections, analyze thermal data, identify damage patterns, and provide recommendations based on the Winn Methodology. How can I assist with your current inspection?",
      timestamp: new Date(),
      context: 'welcome'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualPrompt = () => {
    let context = "You are an expert damage assessment consultant AI trained on Eric Winn's methodology. ";
    
    if (currentStep) {
      context += `The user is currently working on: ${currentStep}. `;
    }
    
    if (propertyData) {
      context += `Property details: ${JSON.stringify(propertyData)}. `;
    }
    
    if (thermalData) {
      context += `Thermal inspection data available. `;
    }
    
    if (roofSections && roofSections.length > 0) {
      context += `Roof sections marked: ${roofSections.length} sections. `;
    }

    context += `
    Core principles of the Winn Methodology:
    1. Comprehensive data collection through thermal imaging, terrestrial walks, test squares
    2. Systematic documentation with precise measurements and photographic evidence
    3. Weather verification and meteorological correlation
    4. Structured analysis of core samples and moisture testing
    5. Detailed damage assessment with impact density calculations
    6. Professional reporting with supporting evidence and compliance documentation

    Provide specific, actionable guidance based on these principles. Reference relevant inspection procedures, measurement techniques, and documentation requirements when appropriate.
    `;
    
    return context;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          context: getContextualPrompt(),
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: currentStep
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (onGuidanceReceived) {
        onGuidanceReceived(data.response);
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getQuickActions = () => {
    const actions = [
      { 
        label: "Thermal Analysis Guide", 
        icon: Thermometer, 
        message: "How should I analyze thermal readings for this property?" 
      },
      { 
        label: "Damage Assessment", 
        icon: AlertTriangle, 
        message: "What are the key indicators of hail damage I should look for?" 
      },
      { 
        label: "Documentation Standards", 
        icon: FileText, 
        message: "What documentation is required for this inspection step?" 
      },
      { 
        label: "Test Square Protocol", 
        icon: MapPin, 
        message: "Walk me through the proper test square methodology." 
      },
      { 
        label: "Photo Requirements", 
        icon: Camera, 
        message: "What photos do I need to take for comprehensive documentation?" 
      }
    ];

    return actions;
  };

  const sendQuickAction = (message: string) => {
    setInputMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <StormyAvatar size={20} />
          Stormy - AI Assistant
          {currentStep && (
            <Badge variant="outline" className="ml-auto">
              {currentStep.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 h-96 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <StormyAvatar size={32} />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <StormyAvatar size={32} />
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Separator />
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Quick Actions
          </div>
          <div className="flex flex-wrap gap-2">
            {getQuickActions().slice(0, 3).map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => sendQuickAction(action.message)}
                className="text-xs"
                disabled={isLoading}
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about inspection procedures, damage assessment, or methodology..."
            className="flex-1 min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}