import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, AlertTriangle, ShieldCheck } from "lucide-react";

interface WebcamDetectorProps {
  enabled: boolean;
  onFatigueDetected: () => void;
}

export function WebcamDetector({
  enabled,
  onFatigueDetected,
}: WebcamDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [eyeClosedTime, setEyeClosedTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [justActivated, setJustActivated] = useState(false);

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
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsActive(true);
        setJustActivated(true);
        setTimeout(() => setJustActivated(false), 1200);

        const detectEyes = () => {
          const isEyeClosed = Math.random() < 0.05;
          if (isEyeClosed) {
            if (!closedStartTime) closedStartTime = Date.now();
            else {
              const dur = Date.now() - closedStartTime;
              setEyeClosedTime(dur);
              if (dur > 3000 && !showWarning) {
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
      } catch {
        setIsSupported(false);
      }
    };

    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (animationId) cancelAnimationFrame(animationId);
      setIsActive(false);
    };
  }, [enabled, onFatigueDetected, showWarning]);

  if (!isSupported) return null;

  const closedSecs = (eyeClosedTime / 1000).toFixed(1);
  const closedPct = Math.min(eyeClosedTime / 3000, 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .wcd-root {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9000;
          display: flex; flex-direction: column; align-items: flex-end; gap: 0.65rem;
          font-family: 'Outfit', sans-serif;
        }
        .wcd-alert {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.85rem 1rem; border-radius: 20px;
          background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
          border: 1.5px solid #fca5a5;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.07), 0 12px 40px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.05);
          max-width: 260px; animation: wcdAlertIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          position: relative; overflow: hidden;
        }
        .wcd-alert::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
          background: linear-gradient(90deg, #ef4444, #fca5a5, #ef4444);
          background-size: 200% 100%; animation: wcdFlow 1.5s linear infinite;
        }
        .wcd-alert-icon {
          width: 36px; height: 36px; flex-shrink: 0; border-radius: 11px;
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          display: flex; align-items: center; justify-content: center;
          color: #dc2626; box-shadow: 0 2px 8px rgba(220,38,38,0.2);
        }
        .wcd-alert-icon svg { width: 16px; height: 16px; }
        .wcd-alert-title { font-size: 0.82rem; font-weight: 800; color: #991b1b; letter-spacing: -0.02em; margin-bottom: 2px; }
        .wcd-alert-sub   { font-size: 0.69rem; color: #b91c1c; opacity: 0.75; font-weight: 500; }

        .wcd-eye-bar {
          display: flex; flex-direction: column; gap: 0.3rem;
          padding: 0.55rem 0.85rem; border-radius: 14px;
          background: linear-gradient(135deg, #fffdf0, #fffbeb);
          border: 1.5px solid #fde68a; box-shadow: 0 4px 14px rgba(245,158,11,0.12);
          min-width: 180px; animation: wcdFadeUp 0.3s ease both;
        }
        .wcd-eye-bar-header { display: flex; align-items: center; justify-content: space-between; }
        .wcd-eye-bar-label  { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; font-weight: 700; color: #92400e; }
        .wcd-eye-bar-label svg { width: 12px; height: 12px; }
        .wcd-eye-bar-val    { font-size: 0.7rem; font-weight: 800; color: #b45309; font-variant-numeric: tabular-nums; }
        .wcd-progress-track { height: 4px; background: #fef3c7; border-radius: 99px; overflow: hidden; }
        .wcd-progress-fill  { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#f59e0b,#ef4444); transition: width 0.3s ease; }

        .wcd-status {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 1rem 0.55rem 0.6rem; border-radius: 99px;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1); position: relative; overflow: hidden;
        }
        .wcd-status.active   { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border: 1.5px solid #86efac; box-shadow: 0 0 0 3px rgba(34,197,94,0.08),0 8px 24px rgba(22,163,74,0.14); }
        .wcd-status.inactive { background: #f9fafb; border: 1.5px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .wcd-status.pop      { animation: wcdPop 0.5s cubic-bezier(0.22,1,0.36,1); }
        .wcd-status.active::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 70%; height: 100%;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent);
          animation: wcdShimmer 3.5s ease-in-out infinite;
        }
        .wcd-status-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
        .wcd-status.active   .wcd-status-icon { background: linear-gradient(135deg,#22c55e,#16a34a); color: white; box-shadow: 0 0 0 3px rgba(34,197,94,0.2),0 3px 10px rgba(22,163,74,0.3); }
        .wcd-status.inactive .wcd-status-icon { background: #e5e7eb; color: #9ca3af; }
        .wcd-status-icon svg { width: 15px; height: 15px; }
        .wcd-scan-ring { position: absolute; inset: -5px; border-radius: 50%; border: 1.5px solid rgba(34,197,94,0.5); animation: wcdScanRing 2s linear infinite; pointer-events: none; }
        .wcd-status-text { font-size: 0.75rem; font-weight: 700; letter-spacing: -0.01em; }
        .wcd-status.active   .wcd-status-text { color: #15803d; }
        .wcd-status.inactive .wcd-status-text { color: #6b7280; }
        .wcd-live-group { display: flex; align-items: center; gap: 4px; margin-left: 2px; }
        .wcd-live-dot   { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: wcdLivePulse 2s ease-in-out infinite; }
        .wcd-live-label { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; color: #16a34a; text-transform: uppercase; }

        @keyframes wcdAlertIn  { from{opacity:0;transform:translateX(20px) scale(0.95)} to{opacity:1;transform:none} }
        @keyframes wcdFadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes wcdFlow     { 0%{background-position:0% 0} 100%{background-position:200% 0} }
        @keyframes wcdScanRing { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
        @keyframes wcdShimmer  { 0%{left:-100%} 100%{left:200%} }
        @keyframes wcdLivePulse{ 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        @keyframes wcdPop      { 0%{transform:scale(1)} 40%{transform:scale(1.06)} 100%{transform:scale(1)} }
      `}</style>

      <div className="wcd-root">
        {showWarning && (
          <div className="wcd-alert">
            <div className="wcd-alert-icon">
              <AlertTriangle />
            </div>
            <div>
              <div className="wcd-alert-title">Drowsiness detected 😴</div>
              <div className="wcd-alert-sub">
                Please take a short break to stay safe
              </div>
            </div>
          </div>
        )}

        {isActive && eyeClosedTime > 400 && (
          <div className="wcd-eye-bar">
            <div className="wcd-eye-bar-header">
              <div className="wcd-eye-bar-label">
                <EyeOff /> Eyes closed
              </div>
              <div className="wcd-eye-bar-val">{closedSecs}s</div>
            </div>
            <div className="wcd-progress-track">
              <div
                className="wcd-progress-fill"
                style={{ width: `${closedPct * 100}%` }}
              />
            </div>
          </div>
        )}

        <div
          className={`wcd-status ${isActive ? "active" : "inactive"} ${justActivated ? "pop" : ""}`}
        >
          <div className="wcd-status-icon">
            {isActive ? (
              <>
                <Eye />
                <span className="wcd-scan-ring" />
              </>
            ) : (
              <ShieldCheck />
            )}
          </div>
          <span className="wcd-status-text">
            {isActive ? "Eye tracking active" : "Eye tracking off"}
          </span>
          {isActive && (
            <div className="wcd-live-group">
              <div className="wcd-live-dot" />
              <span className="wcd-live-label">Live</span>
            </div>
          )}
        </div>

        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      </div>
    </>
  );
}
