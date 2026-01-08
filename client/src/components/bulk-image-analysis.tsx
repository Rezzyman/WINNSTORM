import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  FileArchive, 
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Wand2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { StormyAvatar } from './stormy-avatar';
import { apiRequest } from '@/lib/queryClient';

interface ImageAnalysisResult {
  filename: string;
  analysis: {
    damageDetected: boolean;
    damageType?: string;
    severity?: 'minor' | 'moderate' | 'severe';
    affectedComponents?: string[];
    description: string;
    confidence: number;
    recommendations?: string[];
    thermalAnomalies?: {
      detected: boolean;
      hotspots?: number;
      coldspots?: number;
    };
  };
  error?: string;
}

interface BulkAnalysisResult {
  sessionId: string;
  totalImages: number;
  processedImages: number;
  results: ImageAnalysisResult[];
  summary: {
    totalDamageDetected: number;
    severityBreakdown: { minor: number; moderate: number; severe: number };
    commonDamageTypes: string[];
    affectedComponentsSummary: string[];
    overallAssessment: string;
  };
  processingTimeMs: number;
}

interface ReportSummaryResponse {
  success: boolean;
  summary: string;
  conversationId: number;
}

interface BulkImageAnalysisProps {
  propertyAddress: string;
  onAnalysisComplete?: (analysis: BulkAnalysisResult) => void;
  onIssuesDetected?: (issues: Array<{
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    category: string;
    location: string;
  }>) => void;
  onComponentsDetected?: (components: Array<{
    name: string;
    type: string;
    condition: string;
    notes: string;
  }>) => void;
  onSummaryGenerated?: (summary: string) => void;
}

export function BulkImageAnalysis({ 
  propertyAddress, 
  onAnalysisComplete,
  onIssuesDetected,
  onComponentsDetected,
  onSummaryGenerated
}: BulkImageAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<BulkAnalysisResult | null>(null);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'analyzing' | 'generating' | 'complete'>('idle');
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      setPhase('extracting');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyAddress', propertyAddress);
      
      setPhase('analyzing');
      const response = await fetch('/api/upload/zip/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      setAnalysisResult(data.analysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
      
      if (onIssuesDetected) {
        const issues = data.analysis.results
          .filter((r: ImageAnalysisResult) => r.analysis.damageDetected)
          .map((r: ImageAnalysisResult) => ({
            title: r.analysis.damageType || 'Damage Detected',
            description: r.analysis.description,
            severity: r.analysis.severity === 'severe' ? 'critical' : r.analysis.severity || 'minor',
            category: r.analysis.affectedComponents?.[0] || 'General',
            location: `Image: ${r.filename}`,
          }));
        onIssuesDetected(issues);
      }
      
      if (onComponentsDetected) {
        const componentSet = new Set<string>();
        data.analysis.results.forEach((r: ImageAnalysisResult) => {
          r.analysis.affectedComponents?.forEach(c => componentSet.add(c));
        });
        
        const components = Array.from(componentSet).map(name => {
          const relevantResults = data.analysis.results.filter(
            (r: ImageAnalysisResult) => r.analysis.affectedComponents?.includes(name)
          );
          const hasDamage = relevantResults.some((r: ImageAnalysisResult) => r.analysis.damageDetected);
          const maxSeverity = relevantResults.reduce((max: string, r: ImageAnalysisResult) => {
            if (r.analysis.severity === 'severe') return 'severe';
            if (r.analysis.severity === 'moderate' && max !== 'severe') return 'moderate';
            return max;
          }, 'good');
          
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            type: name,
            condition: hasDamage ? (maxSeverity === 'severe' ? 'poor' : 'fair') : 'good',
            notes: `AI analyzed from ${relevantResults.length} image(s)`,
          };
        });
        onComponentsDetected(components);
      }
      
      setPhase('generating');
      try {
        const summaryResponse = await apiRequest('/api/stormy/generate-report-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulkAnalysis: data.analysis,
            propertyAddress,
          }),
        }) as ReportSummaryResponse;
        
        if (summaryResponse.success && summaryResponse.summary) {
          setReportSummary(summaryResponse.summary);
          if (onSummaryGenerated) {
            onSummaryGenerated(summaryResponse.summary);
          }
        }
      } catch (error) {
        console.error('Failed to generate summary:', error);
      }
      
      setPhase('complete');
      toast({
        title: "Analysis Complete",
        description: `Stormy analyzed ${data.analysis.processedImages} images and found damage in ${data.analysis.summary.totalDamageDetected}.`,
      });
    },
    onError: (error: Error) => {
      setPhase('idle');
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      analyzeMutation.mutate(file);
    }
  }, [analyzeMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    disabled: phase !== 'idle' && phase !== 'complete',
  });

  const isProcessing = phase === 'extracting' || phase === 'analyzing' || phase === 'generating';

  const getPhaseMessage = () => {
    switch (phase) {
      case 'extracting': return 'Extracting images from ZIP...';
      case 'analyzing': return 'Stormy is analyzing each image with AI vision...';
      case 'generating': return 'Generating comprehensive report summary...';
      default: return '';
    }
  };

  const getProgressValue = () => {
    switch (phase) {
      case 'extracting': return 20;
      case 'analyzing': return 60;
      case 'generating': return 90;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-orange-500/5 to-orange-600/10 border-orange-500/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
          <StormyAvatar size={40} />
          <div>
            <span className="flex items-center gap-2">
              Stormy Bulk Analysis
              <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                AI Powered
              </Badge>
            </span>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
              Upload a ZIP of inspection photos for comprehensive AI analysis
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-orange-500 bg-orange-500/20' 
              : 'border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10'
            }
            ${isProcessing ? 'pointer-events-none' : ''}
          `}
          data-testid="bulk-analysis-dropzone"
        >
          <input {...getInputProps()} data-testid="input-bulk-analysis-zip" />
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                <Sparkles className="h-6 w-6 text-orange-400 animate-pulse" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {getPhaseMessage()}
              </p>
              <Progress value={getProgressValue()} className="w-2/3 mx-auto" />
            </div>
          ) : phase === 'complete' ? (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Analysis complete! Drop another ZIP to re-analyze.
              </p>
            </div>
          ) : (
            <>
              <FileArchive className="h-10 w-10 mx-auto text-orange-500 mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {isDragActive ? 'Drop your ZIP here' : 'Drag & drop a ZIP of inspection photos'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Stormy will analyze all images and auto-populate your report
              </p>
            </>
          )}
        </div>

        {analysisResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-gray-500">Images</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {analysisResult.totalImages}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-500">Damage</span>
                </div>
                <p className="text-xl font-bold text-red-500">
                  {analysisResult.summary.totalDamageDetected}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm col-span-2">
                <span className="text-xs text-gray-500">Severity</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {analysisResult.summary.severityBreakdown.severe > 0 && (
                    <Badge className="bg-red-500 text-xs">
                      {analysisResult.summary.severityBreakdown.severe} Severe
                    </Badge>
                  )}
                  {analysisResult.summary.severityBreakdown.moderate > 0 && (
                    <Badge className="bg-yellow-500 text-black text-xs">
                      {analysisResult.summary.severityBreakdown.moderate} Moderate
                    </Badge>
                  )}
                  {analysisResult.summary.severityBreakdown.minor > 0 && (
                    <Badge className="bg-green-500 text-xs">
                      {analysisResult.summary.severityBreakdown.minor} Minor
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {reportSummary && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="h-4 w-4 text-orange-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Stormy's Analysis Summary
                  </h4>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line max-h-48 overflow-y-auto">
                  {reportSummary}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                data-testid="button-toggle-analysis-details"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View Details ({analysisResult.results.length} images)
                  </>
                )}
              </Button>
              
              <Badge variant="outline" className="text-xs">
                {(analysisResult.processingTimeMs / 1000).toFixed(1)}s
              </Badge>
            </div>

            {showDetails && (
              <ScrollArea className="h-64 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-3 space-y-2">
                  {analysisResult.results.map((result, index) => (
                    <div 
                      key={index}
                      className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                          {result.filename}
                        </span>
                        {result.analysis.damageDetected ? (
                          <Badge className={`${getSeverityColor(result.analysis.severity || 'minor')} text-xs`}>
                            {result.analysis.severity || 'Damage'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {result.analysis.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
