import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera as CameraIcon, X, Check, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CameraCaptureProps {
  onCapture: (imageData: string, filename: string) => void;
  buttonLabel?: string;
  captureType?: 'thermal' | 'damage' | 'general';
  className?: string;
}

export function CameraCapture({ 
  onCapture, 
  buttonLabel = "Take Photo",
  captureType = 'general',
  className = ''
}: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const handleNativeCameraClick = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true,
        presentationStyle: 'fullscreen'
      });

      if (image.base64String) {
        const imageData = `data:image/${image.format};base64,${image.base64String}`;
        setCapturedImage(imageData);
        setIsReviewing(true);
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'User cancelled photos app') {
        console.error('Native camera error:', error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleWebCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (isNative) {
      handleNativeCameraClick();
    } else {
      handleWebCameraClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      setIsReviewing(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${captureType}_${timestamp}.jpg`;
    
    onCapture(capturedImage, filename);
    
    setCapturedImage(null);
    setIsReviewing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Photo Captured",
      description: `${captureType} photo saved successfully.`,
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsReviewing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Immediately open camera again
    setTimeout(() => handleCameraClick(), 100);
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setIsReviewing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isReviewing && capturedImage) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured preview"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              data-testid="button-cancel-photo"
              variant="outline"
              onClick={handleCancel}
              className="touch-target"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              data-testid="button-retake-photo"
              variant="outline"
              onClick={handleRetake}
              className="touch-target"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            
            <Button
              data-testid="button-confirm-photo"
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-white touch-target"
            >
              <Check className="h-4 w-4 mr-2" />
              Use
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Web fallback file input */}
      {!isNative && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Camera input"
        />
      )}
      
      <Button
        data-testid={`button-camera-${captureType}`}
        onClick={handleCameraClick}
        variant="outline"
        className={`touch-target ${className}`}
      >
        <CameraIcon className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>
    </>
  );
}
