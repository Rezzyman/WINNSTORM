import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Camera, Lock, Unlock, RotateCcw, Info } from 'lucide-react';
import { cn, hapticFeedback } from '@/lib/utils';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

// Convert degrees to roof pitch (X/12)
function degreesToPitch(degrees: number): number {
  // pitch = 12 * tan(angle in radians)
  const radians = Math.abs(degrees) * (Math.PI / 180);
  return 12 * Math.tan(radians);
}

// Format pitch for display
function formatPitch(pitch: number): string {
  return pitch.toFixed(1);
}

export default function PitchDetectorPage() {
  const [, navigate] = useLocation();
  const [pitch, setPitch] = useState(0); // degrees
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPitch, setLockedPitch] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showInfo, setShowInfo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastHapticPitch = useRef<number | null>(null);

  // Request device orientation permission (iOS 13+)
  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setHasPermission(permission === 'granted');
      } catch (err) {
        console.error('Permission denied:', err);
        setHasPermission(false);
      }
    } else {
      // Non-iOS or older iOS
      setHasPermission(true);
    }
  };

  // Start camera preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Handle device orientation
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (isLocked) return;

    // Beta is the front-to-back tilt (pitch) in degrees
    // Gamma is the left-to-right tilt (roll) in degrees
    let angle = 0;

    // Detect if device is in landscape or portrait based on gamma
    const isLandscape = Math.abs(event.gamma || 0) > 45;
    setOrientation(isLandscape ? 'landscape' : 'portrait');

    if (isLandscape) {
      // In landscape, use gamma for pitch
      angle = event.gamma || 0;
      // Adjust for which way device is rotated
      if (event.beta && event.beta < 0) {
        angle = -angle;
      }
    } else {
      // In portrait, use beta for pitch
      angle = (event.beta || 0) - 90; // Subtract 90 because beta=90 is flat
    }

    // Clamp angle to reasonable range
    angle = Math.max(-60, Math.min(60, angle));

    setPitch(angle);

    // Haptic feedback at specific pitches (0, common roof pitches)
    const currentPitchValue = Math.round(degreesToPitch(angle) * 2) / 2; // Round to 0.5
    const commonPitches = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

    if (lastHapticPitch.current !== currentPitchValue && commonPitches.includes(Math.round(currentPitchValue))) {
      hapticFeedback('light');
      lastHapticPitch.current = currentPitchValue;
    }

    // Strong haptic when level (within 0.5 degrees)
    if (Math.abs(angle) < 0.5 && lastHapticPitch.current !== 0) {
      hapticFeedback('medium');
      lastHapticPitch.current = 0;
    }
  }, [isLocked]);

  // Initialize
  useEffect(() => {
    requestPermission();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // Add orientation listener
  useEffect(() => {
    if (hasPermission) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [hasPermission, handleOrientation]);

  // Lock/unlock pitch reading
  const toggleLock = () => {
    hapticFeedback('medium');
    if (!isLocked) {
      setLockedPitch(pitch);
    }
    setIsLocked(!isLocked);
  };

  // Reset to zero
  const reset = () => {
    hapticFeedback('light');
    setIsLocked(false);
    setLockedPitch(0);
  };

  // Capture photo with pitch overlay
  const captureReading = async () => {
    hapticFeedback('heavy');
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      // TODO: Save photo with pitch metadata
      console.log('Photo captured with pitch:', displayPitch);

      // Show success feedback
      hapticFeedback('success');
    } catch (err) {
      console.error('Capture error:', err);
    }
  };

  const displayPitch = isLocked ? lockedPitch : pitch;
  const pitchValue = degreesToPitch(displayPitch);
  const isLevel = Math.abs(displayPitch) < 1;

  // Calculate line rotation for visual indicator
  const lineRotation = -displayPitch;

  if (hasPermission === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <RotateCcw className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Motion Permission Required</h2>
        <p className="text-slate-400 mb-6">
          Please enable motion access to use the pitch detector.
        </p>
        <button
          onClick={requestPermission}
          className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Enable Motion Access
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pt-safe bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={() => {
              hapticFeedback('light');
              navigate('/');
            }}
            className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg">Roof Pitch Detector</h1>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Level Line */}
          <div
            className="absolute w-[80%] h-0.5 bg-white/80 shadow-lg"
            style={{ transform: `rotate(${lineRotation}deg)` }}
          >
            {/* Center bubble indicator */}
            <div
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-colors",
                isLevel ? "bg-green-500 border-green-400" : "bg-white/20 border-white/60"
              )}
            />
          </div>

          {/* Pitch Display */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-7xl font-bold text-white drop-shadow-lg">
                {formatPitch(pitchValue)}
              </span>
              <span className="text-3xl font-semibold text-white/80 ml-1">/12</span>
            </div>
            <div className={cn(
              "text-2xl font-medium mt-1",
              isLevel ? "text-green-400" : "text-yellow-400"
            )}>
              {Math.abs(displayPitch).toFixed(2)}°
            </div>
            {isLocked && (
              <div className="mt-2 flex items-center justify-center gap-1 text-orange-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">LOCKED</span>
              </div>
            )}
          </div>

          {/* Lock Button */}
          <button
            onClick={toggleLock}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
              isLocked ? "bg-orange-500" : "bg-white/20 backdrop-blur"
            )}
          >
            {isLocked ? (
              <Lock className="w-6 h-6 text-white" />
            ) : (
              <Unlock className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="px-6 pb-8 pb-safe bg-gradient-to-t from-black/60 to-transparent">
          {/* Common Pitches Reference */}
          <div className="flex justify-center gap-3 mb-4">
            {[3, 4, 5, 6, 8, 10, 12].map((p) => (
              <div
                key={p}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  Math.abs(pitchValue - p) < 0.5
                    ? "bg-orange-500 text-white"
                    : "bg-white/10 text-white/60"
                )}
              >
                {p}/12
              </div>
            ))}
          </div>

          {/* Capture Button */}
          <button
            onClick={captureReading}
            className="w-full bg-primary-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <Camera className="w-5 h-5" />
            Capture Reading
          </button>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div
            className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setShowInfo(false)}
          >
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-3">How to Use</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Hold phone flat against the roof surface</li>
                <li>• The pitch displays as X/12 (rise over run)</li>
                <li>• Tap the lock icon to freeze the reading</li>
                <li>• Common pitches: 4/12, 6/12, 8/12</li>
                <li>• Haptic feedback at standard pitches</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="font-semibold text-white mb-2">Pitch Reference</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                  <div>3/12 = 14.0°</div>
                  <div>4/12 = 18.4°</div>
                  <div>5/12 = 22.6°</div>
                  <div>6/12 = 26.6°</div>
                  <div>8/12 = 33.7°</div>
                  <div>12/12 = 45.0°</div>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-4 bg-slate-700 text-white py-2 rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
