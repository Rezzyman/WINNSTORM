import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileArchive, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ExtractedImage {
  filename: string;
  category: string;
  size: number;
  mimeType: string;
}

interface ExtractionResult {
  success: boolean;
  totalFiles: number;
  imagesExtracted: number;
  skippedFiles: string[];
  images: ExtractedImage[];
}

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

interface AnalyzeResponse {
  success: boolean;
  extraction: {
    totalFiles: number;
    imagesExtracted: number;
    skippedFiles: string[];
  };
  analysis: BulkAnalysisResult;
}

interface ZipUploadProps {
  propertyAddress?: string;
  onAnalysisComplete?: (analysis: BulkAnalysisResult) => void;
  onExtractComplete?: (images: ExtractedImage[]) => void;
}

export function ZipUpload({ propertyAddress, onAnalysisComplete, onExtractComplete }: ZipUploadProps) {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BulkAnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const extractMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (propertyAddress) {
        formData.append('propertyAddress', propertyAddress);
      }
      const response = await fetch('/api/upload/zip', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json() as Promise<ExtractionResult>;
    },
    onSuccess: (data) => {
      setExtractionResult(data);
      if (onExtractComplete) {
        onExtractComplete(data.images);
      }
      toast({
        title: "ZIP Extracted Successfully",
        description: `Found ${data.imagesExtracted} images ready for analysis.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (propertyAddress) {
        formData.append('propertyAddress', propertyAddress);
      }
      const response = await fetch('/api/upload/zip/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }
      return response.json() as Promise<AnalyzeResponse>;
    },
    onSuccess: (data) => {
      setExtractionResult({
        success: true,
        totalFiles: data.extraction.totalFiles,
        imagesExtracted: data.extraction.imagesExtracted,
        skippedFiles: data.extraction.skippedFiles,
        images: [],
      });
      setAnalysisResult(data.analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${data.analysis.processedImages} images. ${data.analysis.summary.totalDamageDetected} showed damage.`,
      });
    },
    onError: (error: Error) => {
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
  });

  const isProcessing = extractMutation.isPending || analyzeMutation.isPending;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-white dark:bg-[#1a1f26] border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <FileArchive className="h-5 w-5 text-orange-500" />
          ZIP Upload & AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 hover:bg-orange-500/5'
            }
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
          data-testid="zip-dropzone"
        >
          <input {...getInputProps()} data-testid="input-zip-file" />
          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-orange-500 animate-spin" />
              <p className="text-gray-600 dark:text-gray-300">
                {analyzeMutation.isPending ? 'Analyzing images with Stormy AI...' : 'Extracting images...'}
              </p>
              <Progress value={50} className="w-1/2 mx-auto" />
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {isDragActive ? 'Drop your ZIP file here' : 'Drag & drop a ZIP file with inspection photos'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Stormy will analyze all images and identify damage patterns
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports .zip files up to 100MB
              </p>
            </>
          )}
        </div>

        {analysisResult && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Stormy AI Analysis Results
              </h3>
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                {(analysisResult.processingTimeMs / 1000).toFixed(1)}s
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Images</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysisResult.totalImages}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Damage Found</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {analysisResult.summary.totalDamageDetected}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg col-span-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Severity Breakdown</span>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-red-500">
                    Severe: {analysisResult.summary.severityBreakdown.severe}
                  </Badge>
                  <Badge className="bg-yellow-500 text-black">
                    Moderate: {analysisResult.summary.severityBreakdown.moderate}
                  </Badge>
                  <Badge className="bg-green-500">
                    Minor: {analysisResult.summary.severityBreakdown.minor}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Overall Assessment</h4>
              <p className="text-gray-700 dark:text-gray-300">
                {analysisResult.summary.overallAssessment}
              </p>
              {analysisResult.summary.commonDamageTypes.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Damage Types: </span>
                  {analysisResult.summary.commonDamageTypes.map((type, i) => (
                    <Badge key={i} variant="outline" className="mr-1">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              {analysisResult.summary.affectedComponentsSummary.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Affected Areas: </span>
                  {analysisResult.summary.affectedComponentsSummary.map((comp, i) => (
                    <Badge key={i} variant="secondary" className="mr-1">
                      {comp}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
              data-testid="button-toggle-details"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Detailed Results
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Detailed Results ({analysisResult.results.length} images)
                </>
              )}
            </Button>

            {showDetails && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysisResult.results.map((result, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {result.filename}
                      </span>
                      {result.analysis.damageDetected ? (
                        <Badge className={getSeverityColor(result.analysis.severity || 'minor')}>
                          {result.analysis.severity || 'Damage'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          No Damage
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {result.analysis.description}
                    </p>
                    {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Recommendation:</strong> {result.analysis.recommendations[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
