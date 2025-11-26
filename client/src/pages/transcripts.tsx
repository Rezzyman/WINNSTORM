import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequestRaw, queryClient } from '@/lib/queryClient';
import { LimitlessTranscript, ExtractedKnowledge, TranscriptSegment, WinnMethodologyStep } from '@shared/schema';
import { 
  Upload, FileText, Clock, CheckCircle2, AlertCircle, XCircle, 
  Brain, Loader2, ChevronRight, Play, Pause, Volume2, Tag,
  BookOpen, Plus, Trash2, Edit2, Search, Filter
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', color: 'bg-gray-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Loader2 },
  reviewed: { label: 'Reviewed', color: 'bg-amber-500', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
};

const STEP_LABELS: Record<WinnMethodologyStep, string> = {
  weather_verification: 'Weather Verification',
  thermal_imaging: 'Thermal Imaging',
  terrestrial_walk: 'Terrestrial Walk',
  test_squares: 'Test Squares',
  soft_metals: 'Soft Metals',
  moisture_testing: 'Moisture Testing',
  core_samples: 'Core Samples',
  report_assembly: 'Report Assembly',
};

export default function TranscriptsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<LimitlessTranscript | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    rawTranscript: '',
    duration: 0,
    recordingDate: new Date().toISOString().split('T')[0],
  });

  const { data: transcripts, isLoading } = useQuery<LimitlessTranscript[]>({
    queryKey: ['/api/transcripts'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadForm) => {
      const response = await apiRequestRaw('POST', '/api/transcripts', {
        ...data,
        recordingDate: new Date(data.recordingDate),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Transcript uploaded', description: 'Ready for AI processing' });
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      setShowUpload(false);
      setUploadForm({ title: '', rawTranscript: '', duration: 0, recordingDate: new Date().toISOString().split('T')[0] });
    },
    onError: (error) => {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    }
  });

  const processMutation = useMutation({
    mutationFn: async (id: number) => {
      const transcript = transcripts?.find(t => t.id === id);
      if (!transcript) throw new Error('Transcript not found');
      
      await apiRequestRaw('PATCH', `/api/transcripts/${id}`, { status: 'processing' });
      
      const parseResponse = await apiRequestRaw('POST', '/api/ai/parse-transcript', {
        rawTranscript: transcript.rawTranscript,
        title: transcript.title,
      });
      const parseResult = await parseResponse.json();
      
      await apiRequestRaw('PATCH', `/api/transcripts/${id}`, {
        status: 'reviewed',
        parsedSegments: parseResult.segments,
        extractedKnowledge: parseResult.knowledge,
      });
      
      return parseResult;
    },
    onSuccess: () => {
      toast({ title: 'Processing complete', description: 'Knowledge extracted and ready for review' });
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
    },
    onError: (error) => {
      toast({ title: 'Processing failed', description: error.message, variant: 'destructive' });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ transcriptId, knowledgeIndex, approved }: { transcriptId: number; knowledgeIndex: number; approved: boolean }) => {
      const transcript = transcripts?.find(t => t.id === transcriptId);
      if (!transcript?.extractedKnowledge) throw new Error('No knowledge to approve');
      
      const updatedKnowledge = [...transcript.extractedKnowledge];
      updatedKnowledge[knowledgeIndex] = { ...updatedKnowledge[knowledgeIndex], approved };
      
      await apiRequestRaw('PATCH', `/api/transcripts/${transcriptId}`, {
        extractedKnowledge: updatedKnowledge,
      });
      
      return { transcriptId, knowledgeIndex, approved };
    },
    onSuccess: ({ approved }) => {
      toast({ 
        title: approved ? 'Knowledge approved' : 'Knowledge rejected',
        description: approved ? 'Will be added to knowledge base' : 'Marked for review'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
    }
  });

  const finalizeTranscriptMutation = useMutation({
    mutationFn: async (transcriptId: number) => {
      const transcript = transcripts?.find(t => t.id === transcriptId);
      if (!transcript?.extractedKnowledge) throw new Error('No knowledge to finalize');
      
      const approvedKnowledge = transcript.extractedKnowledge.filter(k => k.approved);
      
      const knowledgeIds: number[] = [];
      for (const knowledge of approvedKnowledge) {
        const response = await apiRequestRaw('POST', '/api/knowledge', {
          title: knowledge.title,
          content: knowledge.content,
          category: 'procedure',
          tags: knowledge.suggestedTags,
          relatedSteps: [knowledge.suggestedStep],
          source: 'transcript',
          sourceId: transcriptId.toString(),
          verified: true,
        });
        const created = await response.json();
        knowledgeIds.push(created.id);
      }
      
      await apiRequestRaw('PATCH', `/api/transcripts/${transcriptId}`, {
        status: 'approved',
        knowledgeEntriesCreated: knowledgeIds,
      });
      
      return { count: knowledgeIds.length };
    },
    onSuccess: ({ count }) => {
      toast({ 
        title: 'Transcript finalized', 
        description: `${count} knowledge entries added to knowledge base` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      setSelectedTranscript(null);
    }
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Limitless Transcripts</h1>
            <p className="text-muted-foreground">Import Eric Winn's field recordings for knowledge extraction</p>
          </div>
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-cyan-500" data-testid="button-upload-transcript">
                <Upload className="h-4 w-4 mr-2" />
                Upload Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Limitless Transcript</DialogTitle>
                <DialogDescription>
                  Paste the raw transcript from a Limitless Pin recording for AI processing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Recording Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Kansas City Site Visit - Day 1"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-transcript-title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Recording Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={uploadForm.recordingDate}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, recordingDate: e.target.value }))}
                      data-testid="input-recording-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="0"
                      value={uploadForm.duration ? uploadForm.duration / 60 : ''}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, duration: parseInt(e.target.value || '0') * 60 }))}
                      data-testid="input-duration"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transcript">Raw Transcript</Label>
                  <Textarea
                    id="transcript"
                    placeholder="Paste the full transcript text here..."
                    className="min-h-[200px]"
                    value={uploadForm.rawTranscript}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, rawTranscript: e.target.value }))}
                    data-testid="textarea-transcript"
                  />
                  <p className="text-xs text-muted-foreground">
                    {uploadForm.rawTranscript.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button 
                  onClick={() => uploadMutation.mutate(uploadForm)}
                  disabled={!uploadForm.title || !uploadForm.rawTranscript || uploadMutation.isPending}
                  data-testid="button-submit-transcript"
                >
                  {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload & Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !transcripts || transcripts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No transcripts yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload Limitless Pin recordings to extract Eric Winn's expertise into the knowledge base
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Transcript
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => {
              const StatusIcon = STATUS_CONFIG[transcript.status]?.icon || Clock;
              const statusConfig = STATUS_CONFIG[transcript.status] || STATUS_CONFIG.pending;
              const approvedCount = transcript.extractedKnowledge?.filter(k => k.approved).length || 0;
              const totalKnowledge = transcript.extractedKnowledge?.length || 0;
              
              return (
                <Card 
                  key={transcript.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTranscript(transcript)}
                  data-testid={`transcript-card-${transcript.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{transcript.title}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${transcript.status === 'processing' ? 'animate-spin' : ''}`} />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {transcript.recordingDate && (
                            <span>{new Date(transcript.recordingDate).toLocaleDateString()}</span>
                          )}
                          {transcript.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(transcript.duration)}
                            </span>
                          )}
                          <span>{transcript.rawTranscript.split(/\s+/).length} words</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {transcript.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              processMutation.mutate(transcript.id);
                            }}
                            disabled={processMutation.isPending}
                            className="bg-gradient-to-r from-primary to-cyan-500"
                            data-testid={`button-process-${transcript.id}`}
                          >
                            {processMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Brain className="h-4 w-4 mr-1" />
                            )}
                            Process with AI
                          </Button>
                        )}
                        {totalKnowledge > 0 && (
                          <div className="text-sm text-right">
                            <span className="text-green-500 font-medium">{approvedCount}</span>
                            <span className="text-muted-foreground">/{totalKnowledge} approved</span>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {totalKnowledge > 0 && (
                      <div className="mt-3">
                        <Progress value={(approvedCount / totalKnowledge) * 100} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {selectedTranscript && (
        <Dialog open={!!selectedTranscript} onOpenChange={() => setSelectedTranscript(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedTranscript.title}
              </DialogTitle>
              <DialogDescription>
                Review extracted knowledge and approve for knowledge base integration
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="knowledge" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="knowledge">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Extracted Knowledge ({selectedTranscript.extractedKnowledge?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="h-4 w-4 mr-2" />
                  Raw Transcript
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="knowledge" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {selectedTranscript.extractedKnowledge && selectedTranscript.extractedKnowledge.length > 0 ? (
                    <div className="space-y-4">
                      {selectedTranscript.extractedKnowledge.map((knowledge, index) => (
                        <Card 
                          key={index} 
                          className={`${knowledge.approved === true ? 'border-green-500/50' : knowledge.approved === false ? 'border-red-500/50' : 'border-border'}`}
                          data-testid={`knowledge-item-${index}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{knowledge.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {knowledge.category.replace(/_/g, ' ')}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {STEP_LABELS[knowledge.suggestedStep] || knowledge.suggestedStep}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(knowledge.confidence * 100)}% confidence
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={knowledge.approved === true ? "default" : "outline"}
                                  className={knowledge.approved === true ? "bg-green-500 hover:bg-green-600" : ""}
                                  onClick={() => approveMutation.mutate({
                                    transcriptId: selectedTranscript.id,
                                    knowledgeIndex: index,
                                    approved: true
                                  })}
                                  data-testid={`button-approve-${index}`}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={knowledge.approved === false ? "default" : "outline"}
                                  className={knowledge.approved === false ? "bg-red-500 hover:bg-red-600" : ""}
                                  onClick={() => approveMutation.mutate({
                                    transcriptId: selectedTranscript.id,
                                    knowledgeIndex: index,
                                    approved: false
                                  })}
                                  data-testid={`button-reject-${index}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{knowledge.content}</p>
                            <div className="flex flex-wrap gap-1">
                              {knowledge.suggestedTags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {selectedTranscript.status === 'pending' 
                          ? 'Click "Process with AI" to extract knowledge'
                          : 'No knowledge extracted yet'}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="transcript" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
                      {selectedTranscript.rawTranscript}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedTranscript(null)}>
                Close
              </Button>
              {selectedTranscript.status === 'reviewed' && (
                <Button
                  onClick={() => finalizeTranscriptMutation.mutate(selectedTranscript.id)}
                  disabled={finalizeTranscriptMutation.isPending || !selectedTranscript.extractedKnowledge?.some(k => k.approved)}
                  className="bg-gradient-to-r from-primary to-cyan-500"
                  data-testid="button-finalize"
                >
                  {finalizeTranscriptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add to Knowledge Base
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
}
