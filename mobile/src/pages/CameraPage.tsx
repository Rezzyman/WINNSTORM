import { useState, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { Camera, X, Check, RotateCcw, Zap, Image, ChevronLeft } from 'lucide-react';
import { cn, hapticFeedback } from '@/lib/utils';

type CaptureMode = 'photo' | 'thermal' | 'damage';

export default function CameraPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ inspectionId?: string }>();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(async () => {
    hapticFeedback('heavy');
    setIsCapturing(true);

    try {
      // Try native camera first
      const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      if (image.base64String) {
        const imageData = `data:image/jpeg;base64,${image.base64String}`;
        setCapturedImage(imageData);
        hapticFeedback('medium');
      }
    } catch (err) {
      console.error('Camera error:', err);
      // Fall back to file input
      fileInputRef.current?.click();
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        hapticFeedback('medium');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccept = async () => {
    if (!capturedImage) return;
    hapticFeedback('medium');

    // Add to local photos array
    setPhotos(prev => [...prev, capturedImage]);

    // Upload to server
    try {
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          inspectionId: params.inspectionId,
          type: mode,
        }),
      });

      if (!res.ok) throw new Error('Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
    }

    setCapturedImage(null);
  };

  const handleRetake = () => {
    hapticFeedback('light');
    setCapturedImage(null);
  };

  const handleClose = () => {
    hapticFeedback('light');
    navigate(-1);
  };

  // Preview mode - show captured image
  if (capturedImage) {
    return (
      <div className="h-full w-full bg-black flex flex-col">
        {/* Preview Header */}
        <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleRetake}
              className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <span className="text-white font-medium bg-black/50 backdrop-blur px-4 py-2 rounded-full">
              Preview
            </span>
            <button
              onClick={handleClose}
              className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div className="flex-1 flex items-center justify-center">
          <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain" />
        </div>

        {/* Accept Button */}
        <div className="pb-safe bg-gradient-to-t from-black/80 to-transparent pt-8">
          <div className="px-6 pb-6">
            <button
              onClick={handleAccept}
              className={cn(
                'w-full bg-primary-500 text-white py-4 rounded-2xl',
                'flex items-center justify-center gap-3 font-semibold text-lg',
                'active:bg-primary-600 transition-colors'
              )}
            >
              <Check className="w-6 h-6" />
              Save Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera viewfinder mode
  return (
    <div className="h-full w-full bg-black flex flex-col">
      {/* Hidden file input fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleClose}
            className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Photo count */}
          {photos.length > 0 && (
            <div className="bg-primary-500 text-white px-4 py-2 rounded-full font-medium">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </div>
          )}

          <button className="w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Guide overlay */}
        <div className="absolute inset-8 border-2 border-white/30 rounded-3xl pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full">
            <span className="text-white/80 text-xs">Point at damage area</span>
          </div>
        </div>

        {/* Crosshair */}
        <div className="w-16 h-16 border-2 border-primary-400 rounded-lg opacity-60" />
      </div>

      {/* Mode Selector */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-center gap-2 bg-slate-800/80 backdrop-blur rounded-2xl p-1">
          {(['photo', 'thermal', 'damage'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                hapticFeedback('light');
                setMode(m);
              }}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-sm capitalize transition-all',
                mode === m
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-400'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Capture Controls */}
      <div className="pb-safe bg-gradient-to-t from-black to-transparent pt-4">
        <div className="flex items-center justify-center gap-8 pb-6">
          {/* Gallery */}
          <button
            onClick={() => {
              hapticFeedback('light');
              fileInputRef.current?.click();
            }}
            className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700"
          >
            <Image className="w-6 h-6 text-slate-400" />
          </button>

          {/* Main Capture Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center',
              'bg-white border-4 border-primary-500',
              'active:scale-95 transition-transform',
              isCapturing && 'opacity-50'
            )}
          >
            <div className={cn(
              'w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center',
              isCapturing && 'animate-pulse'
            )}>
              <Camera className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </button>

          {/* Spacer */}
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
}
