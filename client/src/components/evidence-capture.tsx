import { useState, useEffect, useRef } from 'react';
import { Camera, Image, Mic, MicOff, Upload, X, MapPin, Clock, FileImage, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cameraService, CapturedPhoto } from '@/lib/camera-service';
import { voiceMemoService, VoiceMemo } from '@/lib/voice-memo-service';
import { useOfflineEvidence } from '@/hooks/use-offline-database';
import { cn } from '@/lib/utils';

interface EvidenceCaptureProps {
  inspectionId: string;
  step: number;
  onEvidenceAdded?: (evidence: CapturedPhoto | VoiceMemo) => void;
  className?: string;
}

export function EvidenceCapture({ 
  inspectionId, 
  step, 
  onEvidenceAdded,
  className 
}: EvidenceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState('photo');
  const { saveEvidence } = useOfflineEvidence(inspectionId);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(voiceMemoService.getRecordingDuration());
      }, 100);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const handleCapturePhoto = async () => {
    setIsCapturing(true);
    try {
      const photo = await cameraService.capturePhoto({
        quality: 90,
        includeLocation: true,
        source: 'camera',
      });

      if (photo) {
        setCapturedPhotos(prev => [...prev, photo]);
        
        await saveEvidence({
          inspectionId,
          step,
          type: 'photo',
          localPath: photo.filePath || photo.dataUrl,
          metadata: JSON.stringify(photo.metadata),
          capturedAt: photo.timestamp,
          latitude: photo.latitude,
          longitude: photo.longitude,
        });

        onEvidenceAdded?.(photo);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSelectFromGallery = async () => {
    setIsCapturing(true);
    try {
      const photo = await cameraService.captureFromGallery();

      if (photo) {
        setCapturedPhotos(prev => [...prev, photo]);
        
        await saveEvidence({
          inspectionId,
          step,
          type: 'photo',
          localPath: photo.filePath || photo.dataUrl,
          metadata: JSON.stringify(photo.metadata),
          capturedAt: photo.timestamp,
          latitude: photo.latitude,
          longitude: photo.longitude,
        });

        onEvidenceAdded?.(photo);
      }
    } catch (error) {
      console.error('Failed to select from gallery:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleImportThermal = async () => {
    setIsCapturing(true);
    try {
      const photo = await cameraService.importThermalImage();

      if (photo) {
        setCapturedPhotos(prev => [...prev, photo]);
        
        await saveEvidence({
          inspectionId,
          step,
          type: 'thermal',
          localPath: photo.filePath || photo.dataUrl,
          metadata: JSON.stringify(photo.metadata),
          capturedAt: photo.timestamp,
          latitude: photo.latitude,
          longitude: photo.longitude,
        });

        onEvidenceAdded?.(photo);
      }
    } catch (error) {
      console.error('Failed to import thermal image:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStartRecording = async () => {
    const started = await voiceMemoService.startRecording();
    if (started) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    const memo = await voiceMemoService.stopRecording();
    setIsRecording(false);

    if (memo) {
      setVoiceMemos(prev => [...prev, memo]);
      
      await saveEvidence({
        inspectionId,
        step,
        type: 'voice_memo',
        localPath: memo.filePath || memo.dataUrl,
        metadata: JSON.stringify({ duration: memo.duration }),
        capturedAt: memo.timestamp,
        latitude: memo.latitude,
        longitude: memo.longitude,
      });

      onEvidenceAdded?.(memo);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteMemo = (id: string) => {
    setVoiceMemos(prev => prev.filter(m => m.id !== id));
  };

  const totalEvidence = capturedPhotos.length + voiceMemos.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-white uppercase tracking-wide">
          Capture Evidence
        </h3>
        {totalEvidence > 0 && (
          <Badge variant="secondary" className="bg-[hsl(16,100%,50%)]/20 text-[hsl(16,100%,50%)]">
            {totalEvidence} item{totalEvidence !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#2A2A2A] rounded-none">
          <TabsTrigger 
            value="photo" 
            className="rounded-none data-[state=active]:bg-[hsl(16,100%,50%)] data-[state=active]:text-white"
            data-testid="tab-photo"
          >
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </TabsTrigger>
          <TabsTrigger 
            value="thermal" 
            className="rounded-none data-[state=active]:bg-[hsl(16,100%,50%)] data-[state=active]:text-white"
            data-testid="tab-thermal"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Thermal
          </TabsTrigger>
          <TabsTrigger 
            value="voice" 
            className="rounded-none data-[state=active]:bg-[hsl(16,100%,50%)] data-[state=active]:text-white"
            data-testid="tab-voice"
          >
            <Mic className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCapturePhoto}
              disabled={isCapturing}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-none touch-target"
              data-testid="button-capture-photo"
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">Take Photo</span>
            </Button>
            <Button
              onClick={handleSelectFromGallery}
              disabled={isCapturing}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-none touch-target"
              data-testid="button-select-gallery"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">From Gallery</span>
            </Button>
          </div>

          {capturedPhotos.filter(p => p.type === 'photo').length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.filter(p => p.type === 'photo').map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onDelete={() => handleDeletePhoto(photo.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="thermal" className="mt-4 space-y-4">
          <Button
            onClick={handleImportThermal}
            disabled={isCapturing}
            className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-none touch-target"
            data-testid="button-import-thermal"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Import Thermal Image (FLIR, Seek, etc.)</span>
          </Button>

          <p className="text-sm text-white/60 text-center">
            Import radiometric thermal images from FLIR, Seek, or other thermal cameras
          </p>

          {capturedPhotos.filter(p => p.type === 'thermal').length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.filter(p => p.type === 'thermal').map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onDelete={() => handleDeletePhoto(photo.id)}
                  isThermal
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="voice" className="mt-4 space-y-4">
          <div className="flex flex-col items-center justify-center py-6">
            {isRecording ? (
              <>
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                    <Mic className="h-10 w-10 text-red-500" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border-2 border-red-500/50 animate-ping" />
                </div>
                <p className="text-2xl font-mono text-white mb-4">
                  {voiceMemoService.formatDuration(recordingDuration)}
                </p>
                <Button
                  onClick={handleStopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-none touch-target"
                  data-testid="button-stop-recording"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleStartRecording}
                  className="w-20 h-20 rounded-full bg-[hsl(16,100%,50%)] hover:bg-[hsl(16,100%,40%)] text-white touch-target"
                  data-testid="button-start-recording"
                >
                  <Mic className="h-10 w-10" />
                </Button>
                <p className="text-sm text-white/60 mt-4">Tap to record field notes</p>
              </>
            )}
          </div>

          {voiceMemos.length > 0 && (
            <div className="space-y-2">
              {voiceMemos.map((memo) => (
                <VoiceMemoCard
                  key={memo.id}
                  memo={memo}
                  onDelete={() => handleDeleteMemo(memo.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PhotoThumbnailProps {
  photo: CapturedPhoto;
  onDelete: () => void;
  isThermal?: boolean;
}

function PhotoThumbnail({ photo, onDelete, isThermal }: PhotoThumbnailProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="relative aspect-square bg-[#2A2A2A] rounded-none overflow-hidden cursor-pointer group">
            <img
              src={photo.dataUrl}
              alt="Captured evidence"
              className="w-full h-full object-cover"
            />
            {isThermal && (
              <Badge className="absolute top-1 left-1 bg-purple-500/80 text-white text-[10px] px-1 py-0 rounded-none">
                THERMAL
              </Badge>
            )}
            {photo.latitude && (
              <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded-none">
                <MapPin className="h-3 w-3 text-white" />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-target"
              data-testid={`button-delete-photo-${photo.id}`}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </DialogTrigger>
        <DialogContent className="bg-[#1A1A1A] border-white/10 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isThermal ? 'Thermal Image' : 'Photo Evidence'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <img
              src={photo.dataUrl}
              alt="Full size evidence"
              className="w-full max-h-[60vh] object-contain"
            />
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(photo.timestamp).toLocaleString()}
              </div>
              {photo.latitude && photo.longitude && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface VoiceMemoCardProps {
  memo: VoiceMemo;
  onDelete: () => void;
}

function VoiceMemoCard({ memo, onDelete }: VoiceMemoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(memo.transcription || '');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      const result = await voiceMemoService.transcribeAudio(memo);
      setTranscription(result);
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Card className="bg-[#2A2A2A] border-0 rounded-none">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-[hsl(16,100%,50%)]/20 text-[hsl(16,100%,50%)] hover:bg-[hsl(16,100%,50%)]/30 touch-target"
            data-testid={`button-play-memo-${memo.id}`}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-white">
              <span className="font-mono">{voiceMemoService.formatDuration(memo.duration)}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60 truncate">
                {new Date(memo.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {transcription && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{transcription}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!transcription && !isTranscribing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranscribe}
                className="text-xs text-white/60 hover:text-white touch-target"
                data-testid={`button-transcribe-${memo.id}`}
              >
                Transcribe
              </Button>
            )}
            {isTranscribing && (
              <span className="text-xs text-[hsl(16,100%,50%)] animate-pulse">Transcribing...</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-500 hover:bg-red-500/20 touch-target"
              data-testid={`button-delete-memo-${memo.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={memo.dataUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {memo.latitude && (
          <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
            <MapPin className="h-3 w-3" />
            {memo.latitude.toFixed(4)}, {memo.longitude?.toFixed(4)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
