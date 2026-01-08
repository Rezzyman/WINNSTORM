import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequestRaw, queryClient } from '@/lib/queryClient';
import { InspectionSession, EvidenceAsset, Property, WinnMethodologyStep, WINN_METHODOLOGY_STEPS } from '@shared/schema';
import { 
  CloudLightning, Thermometer, Footprints, Grid3X3, Droplet, FlaskConical, 
  FileText, Camera, Upload, CheckCircle2, Circle, Lock, AlertTriangle,
  ChevronLeft, ChevronRight, HelpCircle, Loader2, X, Eye, Brain, 
  MessageCircle, Sparkles, BookOpen, Mic, Image, Target, BarChart3
} from 'lucide-react';
import { StormySidekick } from '@/components/stormy-sidekick';
import { validateStepCompletion, getStepRequirements, getStepGuidance, ValidationResult } from '@/lib/step-validation-service';
import { inspectionCompletenessService, InspectionCompletenessResult } from '@/lib/inspection-completeness-service';
import { cameraService, CapturedPhoto } from '@/lib/camera-service';
import { voiceMemoService, VoiceMemo } from '@/lib/voice-memo-service';

const STEP_CONFIG: Record<WinnMethodologyStep, {
  title: string;
  icon: typeof CloudLightning;
  description: string;
  color: string;
}> = {
  weather_verification: {
    title: 'Weather Verification',
    icon: CloudLightning,
    description: 'Confirm storm occurrence and date correlation',
    color: 'text-orange-500'
  },
  thermal_imaging: {
    title: 'Thermal Imaging',
    icon: Thermometer,
    description: 'Capture thermal scans for moisture detection',
    color: 'text-orange-600'
  },
  terrestrial_walk: {
    title: 'Terrestrial Walk',
    icon: Footprints,
    description: 'Document visible damage from ground level',
    color: 'text-gray-500'
  },
  test_squares: {
    title: 'Test Squares',
    icon: Grid3X3,
    description: 'Mark and count impacts in test areas',
    color: 'text-orange-400'
  },
  soft_metals: {
    title: 'Soft Metals',
    icon: Droplet,
    description: 'Document dents on gutters, vents, and HVAC',
    color: 'text-gray-600'
  },
  moisture_testing: {
    title: 'Moisture Testing',
    icon: FlaskConical,
    description: 'Take moisture meter readings',
    color: 'text-orange-500'
  },
  core_samples: {
    title: 'Core Samples',
    icon: FlaskConical,
    description: 'Extract and document core samples if needed',
    color: 'text-gray-500'
  },
  report_assembly: {
    title: 'Report Assembly',
    icon: FileText,
    description: 'Compile findings into final report',
    color: 'text-primary'
  }
};

interface SessionResponse {
  session: InspectionSession;
  evidence: EvidenceAsset[];
  property: Property;
  stepRequirements: Record<WinnMethodologyStep, {
    minPhotos: number;
    requiredFields: string[];
    aiValidationRequired: boolean;
    canSkip: boolean;
    skipReasons?: string[];
  }>;
}

interface CoachingContent {
  welcome: string;
  objectives: string[];
  checklist: string[];
  whyItMatters: string;
  commonMistakes: string[];
  tips: string[];
}

interface AnalysisResult {
  validation: {
    isValid: boolean;
    confidence: number;
    findings: string[];
    recommendations: string[];
    warnings: string[];
  };
  summary: string;
  detectedElements: {
    type: string;
    description: string;
    severity?: string;
    confidence: number;
  }[];
  coachingTips: string[];
}

export default function InspectionWizard() {
  const [, params] = useRoute('/inspection/:propertyId');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : null;
  
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showCoaching, setShowCoaching] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [stepValidation, setStepValidation] = useState<ValidationResult | null>(null);
  const [completenessData, setCompletenessData] = useState<InspectionCompletenessResult | null>(null);

  const { data: sessionData, isLoading, error, refetch } = useQuery<SessionResponse>({
    queryKey: ['/api/inspection/session/active', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/inspection/session/active?propertyId=${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!propertyId
  });

  const currentStep = sessionData?.session.currentStep as WinnMethodologyStep || 'weather_verification';
  const currentStepIndex = WINN_METHODOLOGY_STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / WINN_METHODOLOGY_STEPS.length) * 100;
  const stepConfig = STEP_CONFIG[currentStep];
  const requirements = sessionData?.stepRequirements[currentStep];
  const currentEvidence = sessionData?.evidence.filter(e => e.step === currentStep) || [];

  const { data: coaching } = useQuery<CoachingContent>({
    queryKey: ['/api/ai/coaching', currentStep, experienceLevel],
    queryFn: async () => {
      const response = await fetch(`/api/ai/coaching/${currentStep}?level=${experienceLevel}`);
      if (!response.ok) throw new Error('Failed to fetch coaching');
      return response.json();
    },
    enabled: !!currentStep && showCoaching
  });

  const advanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequestRaw('POST', `/api/inspection/session/${sessionData?.session.id}/advance`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Step completed!",
        description: data.message || `Moving to ${data.nextStep?.replace(/_/g, ' ') || 'next step'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspection/session/active', propertyId] });
      setAnalysisResult(null);
    },
    onError: (error: any) => {
      const errorData = error.response?.data || {};
      toast({
        title: "Cannot advance",
        description: errorData.message || "Requirements not met",
        variant: "destructive"
      });
    }
  });

  const skipMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequestRaw('POST', `/api/inspection/session/${sessionData?.session.id}/skip`, { reason });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Step skipped",
        description: data.message,
      });
      setShowSkipDialog(false);
      setSkipReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/inspection/session/active', propertyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot skip",
        description: error.response?.data?.message || "Failed to skip step",
        variant: "destructive"
      });
    }
  });

  const analyzeEvidence = async (evidenceId: number) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/inspection/evidence/${evidenceId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setAnalysisResult(data.analysis);
      refetch();
      toast({
        title: "Analysis complete!",
        description: data.analysis.summary,
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!currentStep || !sessionData) return;
    
    const evidence = currentEvidence.map(e => ({
      id: e.id,
      type: e.assetType,
      url: e.fileUrl || undefined,
      aiAnalysis: e.aiAnalysis ? {
        isValid: e.aiAnalysis.isValid,
        confidence: e.aiAnalysis.confidence,
      } : undefined,
    }));
    
    const validation = validateStepCompletion(currentStep, evidence, {});
    setStepValidation(validation);
  }, [currentStep, currentEvidence, sessionData]);

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    try {
      const photo = await cameraService.capturePhoto({
        quality: 90,
        includeLocation: true,
        source: 'camera',
      });

      if (photo && sessionData?.session.id) {
        const formData = new FormData();
        const blob = await (await fetch(photo.dataUrl)).blob();
        formData.append('file', blob, `photo_${Date.now()}.jpg`);
        formData.append('sessionId', sessionData.session.id.toString());
        formData.append('step', currentStep);
        formData.append('assetType', 'photo');
        formData.append('latitude', photo.latitude?.toString() || '');
        formData.append('longitude', photo.longitude?.toString() || '');

        const response = await fetch('/api/inspection/evidence/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (response.ok) {
          refetch();
          toast({
            title: "Photo captured!",
            description: "Evidence added to this step",
          });
        }
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      toast({
        title: "Capture failed",
        description: "Could not capture photo",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleImportThermal = async () => {
    setIsCapturing(true);
    try {
      const photo = await cameraService.importThermalImage();

      if (photo && sessionData?.session.id) {
        const formData = new FormData();
        const blob = await (await fetch(photo.dataUrl)).blob();
        formData.append('file', blob, `thermal_${Date.now()}.jpg`);
        formData.append('sessionId', sessionData.session.id.toString());
        formData.append('step', currentStep);
        formData.append('assetType', 'thermal');
        formData.append('latitude', photo.latitude?.toString() || '');
        formData.append('longitude', photo.longitude?.toString() || '');

        const response = await fetch('/api/inspection/evidence/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (response.ok) {
          refetch();
          toast({
            title: "Thermal image imported!",
            description: "Evidence added to this step",
          });
        }
      }
    } catch (error) {
      console.error('Failed to import thermal:', error);
      toast({
        title: "Import failed",
        description: "Could not import thermal image",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStartVoiceRecording = async () => {
    const started = await voiceMemoService.startRecording();
    if (started) {
      setIsRecordingVoice(true);
      const interval = setInterval(() => {
        setRecordingDuration(voiceMemoService.getRecordingDuration());
      }, 100);
      (window as any).__voiceRecordingInterval = interval;
    }
  };

  const handleStopVoiceRecording = async () => {
    if ((window as any).__voiceRecordingInterval) {
      clearInterval((window as any).__voiceRecordingInterval);
    }
    setIsRecordingVoice(false);
    setRecordingDuration(0);

    const memo = await voiceMemoService.stopRecording();
    if (memo) {
      const result = await voiceMemoService.transcribeAudio(memo, stepConfig.title);
      
      if (result.transcription) {
        toast({
          title: "Voice memo recorded",
          description: result.status === 'success' ? 'Transcribed and saved' : 'Saved for playback',
        });
      }
    }
  };

  if (!propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6">
          <CardTitle className="text-destructive">No Property Selected</CardTitle>
          <CardDescription className="mt-2">Please select a property to start inspection</CardDescription>
          <Button className="mt-4 touch-target h-12" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6">
          <CardTitle className="text-destructive">Error Loading Session</CardTitle>
          <CardDescription className="mt-2">Failed to load inspection session</CardDescription>
          <Button className="mt-4 touch-target h-12" onClick={() => refetch()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const canAdvance = () => {
    if (!requirements) return false;
    if (currentEvidence.length < requirements.minPhotos) return false;
    if (requirements.aiValidationRequired) {
      return currentEvidence.some(e => e.aiAnalysis?.isValid);
    }
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" data-testid="inspection-wizard">
      <Header />
      
      <main className="flex-grow pb-32">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" data-testid="property-title">
                {sessionData?.property?.name || 'Inspection'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {sessionData?.property?.address}
              </p>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Step {currentStepIndex + 1} of {WINN_METHODOLOGY_STEPS.length}
            </Badge>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          </div>

          <div className="flex overflow-x-auto pb-4 mb-6 gap-2" data-testid="step-indicators">
            {WINN_METHODOLOGY_STEPS.map((step, index) => {
              const config = STEP_CONFIG[step];
              const isCompleted = sessionData?.session.stepsCompleted?.includes(step);
              const isCurrent = step === currentStep;
              const isLocked = index > currentStepIndex;
              const StepIcon = config.icon;

              return (
                <div 
                  key={step}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg transition-all ${
                    isCurrent ? 'bg-primary/10 ring-2 ring-primary' :
                    isCompleted ? 'bg-orange-500/10' :
                    isLocked ? 'opacity-50' : ''
                  }`}
                  data-testid={`step-indicator-${step}`}
                >
                  <div className={`p-2 rounded-full ${
                    isCompleted ? 'bg-orange-500/20' :
                    isCurrent ? 'bg-primary/20' :
                    'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <StepIcon className={`h-5 w-5 ${isCurrent ? config.color : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center w-16 truncate ${
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {config.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <Card className="mb-6" data-testid="current-step-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const StepIcon = stepConfig.icon;
                  return (
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-400/20`}>
                      <StepIcon className={`h-6 w-6 ${stepConfig.color}`} />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="text-xl" data-testid="step-title">{stepConfig.title}</CardTitle>
                  <CardDescription>{stepConfig.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showCoaching && coaching && (
                <Alert className="mb-6 bg-gradient-to-r from-orange-500/5 to-orange-400/5 border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Stormy's Guidance</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-3">{coaching.welcome}</p>
                    <div className="space-y-2">
                      <p className="font-medium text-sm text-foreground">Why This Matters:</p>
                      <p className="text-sm text-muted-foreground">{coaching.whyItMatters}</p>
                    </div>
                    {coaching.tips.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {coaching.tips.map((tip, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {tip}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 mb-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span>Evidence Captured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      currentEvidence.length >= (requirements?.minPhotos || 0) 
                        ? 'text-orange-500' 
                        : 'text-amber-500'
                    }`}>
                      {currentEvidence.length}
                    </span>
                    <span className="text-muted-foreground">
                      / {requirements?.minPhotos || 0} required
                    </span>
                  </div>
                </div>

                {requirements?.aiValidationRequired && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-muted-foreground" />
                      <span>AI Validation</span>
                    </div>
                    <div>
                      {currentEvidence.some(e => e.aiAnalysis?.isValid) ? (
                        <Badge className="bg-orange-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {currentEvidence.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Captured Evidence</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {currentEvidence.map((evidence) => (
                      <div 
                        key={evidence.id} 
                        className="relative rounded-lg overflow-hidden border bg-muted aspect-square cursor-pointer hover:ring-2 ring-primary transition-all"
                        onClick={() => setSelectedEvidence(evidence)}
                        data-testid={`evidence-${evidence.id}`}
                      >
                        {evidence.fileUrl ? (
                          <img 
                            src={evidence.fileUrl} 
                            alt={evidence.caption || 'Evidence'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {evidence.aiAnalysis?.isValid !== undefined && (
                          <div className={`absolute top-1 right-1 p-1 rounded-full ${
                            evidence.aiAnalysis.isValid ? 'bg-orange-500' : 'bg-amber-500'
                          }`}>
                            {evidence.aiAnalysis.isValid ? (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stepValidation && !stepValidation.canAdvance && stepValidation.blockers.length > 0 && (
                <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-500">Requirements</AlertTitle>
                  <AlertDescription className="text-sm">
                    {stepValidation.blockers.map((b, i) => (
                      <p key={i} className="text-muted-foreground">{b.message}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <Button 
                  variant="outline" 
                  className="h-16 touch-target flex-col gap-1"
                  onClick={handleCapturePhoto}
                  disabled={isCapturing}
                  data-testid="button-capture-photo"
                >
                  {isCapturing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                  <span className="text-xs">Photo</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 touch-target flex-col gap-1"
                  onClick={handleImportThermal}
                  disabled={isCapturing}
                  data-testid="button-import-thermal"
                >
                  <Thermometer className="h-5 w-5 text-red-500" />
                  <span className="text-xs">Thermal</span>
                </Button>
                
                <Button 
                  variant={isRecordingVoice ? "destructive" : "outline"}
                  className={`h-16 touch-target flex-col gap-1 ${isRecordingVoice ? 'animate-pulse' : ''}`}
                  onClick={isRecordingVoice ? handleStopVoiceRecording : handleStartVoiceRecording}
                  data-testid="button-voice-memo"
                >
                  <Mic className={`h-5 w-5 ${isRecordingVoice ? 'text-white' : ''}`} />
                  <span className="text-xs">
                    {isRecordingVoice ? `${Math.floor(recordingDuration)}s` : 'Voice'}
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 touch-target flex-col gap-1"
                  onClick={() => navigate(`/upload?propertyId=${propertyId}&step=${currentStep}`)}
                  data-testid="button-upload-files"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </Button>
              </div>
              
              <div className="flex gap-3">
                {currentEvidence.length > 0 && !currentEvidence.some(e => e.aiAnalysis) && (
                  <Button 
                    className="flex-1 h-14 touch-target bg-gradient-to-r from-orange-500 to-orange-600"
                    onClick={() => currentEvidence[0] && analyzeEvidence(currentEvidence[0].id)}
                    disabled={isAnalyzing}
                    data-testid="button-analyze"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-5 w-5 mr-2" />
                    )}
                    Analyze with Stormy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {analysisResult && (
            <Card className="mb-6 border-primary/30" data-testid="analysis-result">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Stormy's Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{analysisResult.summary}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Validation:</span>
                  {analysisResult.validation.isValid ? (
                    <Badge className="bg-orange-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Valid ({analysisResult.validation.confidence}% confidence)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Needs Review
                    </Badge>
                  )}
                </div>

                {analysisResult.validation.findings.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key Findings:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysisResult.validation.findings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.coachingTips.length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">Pro Tips:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysisResult.coachingTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t" data-testid="navigation-footer">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Button 
            variant="outline"
            className="h-14 px-6 touch-target"
            onClick={() => navigate('/dashboard')}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Select 
              value={experienceLevel} 
              onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}
            >
              <SelectTrigger className="w-32 h-10" data-testid="select-experience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setShowCoaching(!showCoaching)}
              data-testid="toggle-coaching"
            >
              <HelpCircle className={`h-5 w-5 ${showCoaching ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          <div className="flex gap-2">
            {requirements?.canSkip && (
              <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-14 px-4 touch-target text-amber-500 border-amber-500/50"
                    data-testid="button-skip"
                  >
                    Skip
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Skip {stepConfig.title}?</DialogTitle>
                    <DialogDescription>
                      Skipping affects your compliance score. Select a valid reason:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {requirements.skipReasons?.map((reason) => (
                      <Button
                        key={reason}
                        variant={skipReason === reason ? "default" : "outline"}
                        className="w-full justify-start h-12 touch-target"
                        onClick={() => setSkipReason(reason)}
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="touch-target h-12" onClick={() => setShowSkipDialog(false)}>Cancel</Button>
                    <Button 
                      variant="destructive"
                      className="touch-target h-12"
                      disabled={!skipReason || skipMutation.isPending}
                      onClick={() => skipMutation.mutate(skipReason)}
                    >
                      {skipMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Skip
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button 
              className="h-14 px-6 touch-target bg-gradient-to-r from-orange-500 to-orange-600"
              disabled={!canAdvance() || advanceMutation.isPending}
              onClick={() => advanceMutation.mutate()}
              data-testid="button-next"
            >
              {advanceMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : currentStepIndex === WINN_METHODOLOGY_STEPS.length - 1 ? (
                <>
                  Complete
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evidence Details</DialogTitle>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-4">
              {selectedEvidence.fileUrl && (
                <img 
                  src={selectedEvidence.fileUrl} 
                  alt="Evidence" 
                  className="w-full rounded-lg"
                />
              )}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 touch-target h-12"
                  onClick={() => {
                    analyzeEvidence(selectedEvidence.id);
                    setSelectedEvidence(null);
                  }}
                  disabled={isAnalyzing}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
                <Button variant="outline" className="touch-target h-12" onClick={() => setSelectedEvidence(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <StormySidekick
        currentStep={currentStep}
        experienceLevel={experienceLevel}
        propertyId={propertyId}
        sessionId={sessionData?.session.id}
        evidenceCount={currentEvidence.length}
        onLevelChange={setExperienceLevel}
        isFloating={true}
      />
    </div>
  );
}
