import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Camera, Thermometer, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ThermalReading, DetailedIssue, InspectionMetric } from '@shared/schema';

interface ThermalAnalysisResult {
  thermalReadings: ThermalReading[];
  issues: DetailedIssue[];
  metrics: InspectionMetric[];
  summary: string;
  recommendations: string[];
  confidence: number;
}

interface ThermalAnalysisProps {
  onAnalysisComplete: (result: ThermalAnalysisResult) => void;
  location: string;
  ambientTemp?: number;
  humidity?: number;
}

export const ThermalAnalysis: React.FC<ThermalAnalysisProps> = ({
  onAnalysisComplete,
  location,
  ambientTemp,
  humidity
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [results, setResults] = useState<ThermalAnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only image files are supported for thermal analysis",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(validFiles);
  }, [toast]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImage = async (file: File): Promise<ThermalAnalysisResult> => {
    try {
      const base64 = await convertToBase64(file);
      
      const response = await apiRequest<ThermalAnalysisResult>('/api/thermal/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          metadata: {
            location,
            timestamp: new Date().toISOString(),
            ambientTemp,
            humidity
          }
        })
      });
      
      return response;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Failed to analyze ${file.name}: ${error.message}`);
    }
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select thermal images to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);
    setResults([]);

    try {
      const analysisResults: ThermalAnalysisResult[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setAnalysisProgress(((i + 0.5) / selectedFiles.length) * 100);
        
        const result = await analyzeImage(file);
        analysisResults.push(result);
        
        setAnalysisProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      setResults(analysisResults);
      setActiveTab("results");
      
      // Combine all results for the parent component
      const combinedResult: ThermalAnalysisResult = {
        thermalReadings: analysisResults.flatMap(r => r.thermalReadings),
        issues: analysisResults.flatMap(r => r.issues),
        metrics: analysisResults.flatMap(r => r.metrics),
        summary: analysisResults.map(r => r.summary).join('\n\n'),
        recommendations: analysisResults.flatMap(r => r.recommendations),
        confidence: analysisResults.reduce((acc, r) => acc + r.confidence, 0) / analysisResults.length
      };
      
      onAnalysisComplete(combinedResult);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${selectedFiles.length} thermal images`,
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'minor': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'caution': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-muted-foreground">{location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {ambientTemp && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Ambient Temp</p>
                  <p className="text-xs text-muted-foreground">{ambientTemp}°F</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {humidity && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="text-sm font-medium">Humidity</p>
                  <p className="text-xs text-muted-foreground">{humidity}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            AI Thermal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Images</TabsTrigger>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="thermal-images" className="text-lg font-medium cursor-pointer">
                    Select Thermal Images
                  </Label>
                  <Input
                    id="thermal-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload thermal images for AI analysis
                  </p>
                </div>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Files:</h4>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analyze" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Activity className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-medium">AI Analysis Engine</h3>
                </div>
                
                <p className="text-muted-foreground">
                  Advanced thermal imaging analysis powered by AI
                </p>
                
                {analyzing && (
                  <div className="space-y-2">
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing thermal images... {Math.round(analysisProgress)}%
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleAnalyze}
                  disabled={selectedFiles.length === 0 || analyzing}
                  className="w-full"
                >
                  {analyzing ? 'Analyzing...' : `Analyze ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No analysis results yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Analysis {index + 1}</span>
                          <Badge variant={result.confidence > 0.8 ? "default" : "secondary"}>
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="summary">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="readings">Readings</TabsTrigger>
                            <TabsTrigger value="issues">Issues</TabsTrigger>
                            <TabsTrigger value="metrics">Metrics</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="summary" className="space-y-4">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-sm">{result.summary}</p>
                            </div>
                            
                            {result.recommendations.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Recommendations:</h4>
                                <ul className="text-sm space-y-1">
                                  {result.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="readings">
                            <ScrollArea className="h-64">
                              <div className="space-y-2">
                                {result.thermalReadings.map((reading, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <div>
                                      <p className="font-medium">{reading.location}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {reading.temperature}°F
                                      </p>
                                    </div>
                                    <Badge className={getAlertLevelColor(reading.alertLevel)}>
                                      {reading.alertLevel}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                          
                          <TabsContent value="issues">
                            <ScrollArea className="h-64">
                              <div className="space-y-2">
                                {result.issues.map((issue, i) => (
                                  <div key={i} className="p-3 border rounded">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium">{issue.title}</h4>
                                      <Badge className={getSeverityColor(issue.severity)}>
                                        {issue.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Location: {issue.location} | Action: {issue.recommendedAction}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                          
                          <TabsContent value="metrics">
                            <ScrollArea className="h-64">
                              <div className="space-y-2">
                                {result.metrics.map((metric, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <div>
                                      <p className="font-medium">{metric.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {metric.value} {metric.unit}
                                      </p>
                                    </div>
                                    <Badge variant={metric.status === 'pass' ? 'default' : 'destructive'}>
                                      {metric.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};