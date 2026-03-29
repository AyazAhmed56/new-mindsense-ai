import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface WebcamDetectorProps {
  enabled: boolean;
  onFatigueDetected: () => void;
}

export function WebcamDetector({ enabled, onFatigueDetected }: WebcamDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [eyeClosedTime, setEyeClosedTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      return;
    }

    let stream: MediaStream | null = null;
    let animationId: number;
    let closedStartTime: number | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsActive(true);

        // Simulate eye detection
        const detectEyes = () => {
          const isEyeClosed = Math.random() < 0.05;

          if (isEyeClosed) {
            if (!closedStartTime) {
              closedStartTime = Date.now();
            } else {
              const closedDuration = Date.now() - closedStartTime;
              setEyeClosedTime(closedDuration);

              if (closedDuration > 3000 && !showWarning) {
                setShowWarning(true);
                onFatigueDetected();

                setTimeout(() => {
                  setShowWarning(false);
                  closedStartTime = null;
                }, 10000);
              }
            }
          } else {
            closedStartTime = null;
            setEyeClosedTime(0);
          }

          animationId = requestAnimationFrame(detectEyes);
        };

        detectEyes();
      } catch (err) {
        console.error('Camera access denied:', err);
        setIsSupported(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      setIsActive(false);
    };
  }, [enabled, onFatigueDetected, showWarning]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Warning Toast */}
      {showWarning && (
        <div className="mb-4 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in max-w-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Eye closure detected! 😴</p>
            <p className="text-xs opacity-90">You may be getting drowsy</p>
          </div>
        </div>
      )}

      {/* Camera Status */}
      <div className={`glass p-3 rounded-xl shadow-lg flex items-center gap-2 ${
        isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50'
      }`}>
        {isActive ? (
          <>
            <Camera className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Eye tracking active</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </>
        ) : (
          <>
            <CameraOff className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Eye tracking off</span>
          </>
        )}
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {isActive && eyeClosedTime > 0 && (
        <div className="absolute bottom-14 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs whitespace-nowrap animate-pulse">
          Eyes closed: {(eyeClosedTime / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
