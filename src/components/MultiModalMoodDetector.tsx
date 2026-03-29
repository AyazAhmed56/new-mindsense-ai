import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  Mic,
  Smile,
  CameraOff,
  MicOff,
  Activity,
} from "lucide-react";

type CognitiveState = "fatigue" | "confused" | "focus";
type MoodType = "happy" | "sad" | "stressed" | "neutral" | "excited" | "tired";

interface MultiModalMoodDetectorProps {
  onMoodDetected: (mood: {
    typing: CognitiveState;
    visual: MoodType | null;
    audio: MoodType | null;
    combined: CognitiveState;
    confidence: number;
  }) => void;
  enabled: boolean;
}

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: "😊",
  sad: "😔",
  stressed: "😤",
  neutral: "😐",
  excited: "🤩",
  tired: "😴",
};

const MOOD_COLOR: Record<MoodType, string> = {
  happy: "#16a34a",
  sad: "#6366f1",
  stressed: "#f59e0b",
  neutral: "#64748b",
  excited: "#10b981",
  tired: "#94a3b8",
};

export function MultiModalMoodDetector({
  onMoodDetected,
  enabled,
}: MultiModalMoodDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [visualMood, setVisualMood] = useState<MoodType | null>(null);
  const [audioMood, setAudioMood] = useState<MoodType | null>(null);
  const [typingMood] = useState<CognitiveState>("focus");
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        analyzeVideoFrames();
      }
    } catch {
      console.log("Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const analyzeVideoFrames = useCallback(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== 4) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let brightnessSum = 0,
      redSum = 0;
    const pixelCount = pixels.length / 4;
    for (let i = 0; i < pixels.length; i += 4) {
      brightnessSum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      redSum += pixels[i];
    }
    const avgBrightness = brightnessSum / pixelCount;
    const redRatio = redSum / pixelCount / avgBrightness;
    let detectedMood: MoodType = "neutral";
    if (redRatio > 1.15 && avgBrightness > 100) detectedMood = "excited";
    else if (avgBrightness < 80) detectedMood = "tired";
    else if (redRatio < 0.95) detectedMood = "sad";
    else if (redRatio > 1.1) detectedMood = "stressed";
    else if (avgBrightness > 120) detectedMood = "happy";
    setVisualMood(detectedMood);
    requestAnimationFrame(analyzeVideoFrames);
  }, [cameraActive]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      setMicActive(true);
      analyzeAudio();
    } catch {
      console.log("Microphone access denied");
    }
  }, []);

  const stopMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    setMicActive(false);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!micActive || !analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0,
      lowFreqSum = 0,
      highFreqSum = 0;
    const midPoint = Math.floor(dataArray.length / 2);
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
      if (i < midPoint) lowFreqSum += dataArray[i];
      else highFreqSum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const freqRatio =
      highFreqSum / (dataArray.length - midPoint) / (lowFreqSum / midPoint + 1);
    setAudioLevel(Math.min(avg / 80, 1));
    let detectedAudioMood: MoodType = "neutral";
    if (avg < 10) detectedAudioMood = "tired";
    else if (freqRatio > 1.5 && avg > 50) detectedAudioMood = "excited";
    else if (freqRatio < 0.8) detectedAudioMood = "sad";
    else if (avg > 80) detectedAudioMood = "stressed";
    else if (avg > 40 && freqRatio > 1 && freqRatio < 1.3)
      detectedAudioMood = "happy";
    setAudioMood(detectedAudioMood);
    setTimeout(() => requestAnimationFrame(analyzeAudio), 500);
  }, [micActive]);

  useEffect(() => {
    if (!enabled) return;
    const moodToCognitive = (mood: MoodType | null): CognitiveState => {
      if (!mood) return "focus";
      if (mood === "tired" || mood === "sad") return "fatigue";
      if (mood === "stressed") return "confused";
      return "focus";
    };
    const votes = [
      moodToCognitive(visualMood),
      moodToCognitive(audioMood),
      typingMood,
    ];
    const counts = { fatigue: 0, confused: 0, focus: 0 };
    votes.forEach((v) => counts[v]++);
    const combined = Object.entries(counts).sort(
      (a, b) => b[1] - a[1],
    )[0][0] as CognitiveState;
    onMoodDetected({
      typing: typingMood,
      visual: visualMood,
      audio: audioMood,
      combined,
      confidence: 0.6 + (counts[combined] / 3) * 0.3,
    });
  }, [visualMood, audioMood, typingMood, enabled, onMoodDetected]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        .mmd-wrap {
          font-family: 'Outfit', sans-serif;
          background: #ffffff;
          border: 1px solid #d1fae5;
          border-radius: 24px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          box-shadow: 0 4px 24px rgba(22,163,74,0.08), 0 1px 4px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
        }
        .mmd-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #22c55e, #4ade80, #86efac, #22c55e);
          background-size: 200% 100%;
          animation: mmdGradientFlow 3s linear infinite;
        }

        .mmd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }
        .mmd-title-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .mmd-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          display: flex; align-items: center; justify-content: center;
          color: #15803d;
          box-shadow: 0 2px 8px rgba(22,163,74,0.2);
        }
        .mmd-icon-wrap svg { width: 17px; height: 17px; }
        .mmd-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #14532d;
          letter-spacing: -0.02em;
        }
        .mmd-subtitle { font-size: 0.68rem; color: #86efac; font-weight: 500; }

        .mmd-live-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 0.25rem 0.65rem;
          border-radius: 99px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          font-size: 0.66rem;
          font-weight: 700;
          color: #16a34a;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .mmd-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: mmdPulse 1.5s ease-in-out infinite;
        }

        /* Controls */
        .mmd-controls {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .mmd-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          border-radius: 14px;
          border: 1.5px solid transparent;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }
        .mmd-btn svg { width: 14px; height: 14px; }
        .mmd-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.2s;
        }
        .mmd-btn:hover::after { background: rgba(255,255,255,0.15); }

        .mmd-btn.camera-off {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #86efac;
        }
        .mmd-btn.camera-off:hover { border-color: #4ade80; box-shadow: 0 4px 12px rgba(34,197,94,0.2); }
        .mmd-btn.camera-on {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(22,163,74,0.35);
          animation: mmdBtnPulse 2.5s ease-in-out infinite;
        }

        .mmd-btn.mic-off {
          background: #eff6ff;
          color: #2563eb;
          border-color: #93c5fd;
        }
        .mmd-btn.mic-off:hover { border-color: #60a5fa; box-shadow: 0 4px 12px rgba(37,99,235,0.15); }
        .mmd-btn.mic-on {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          animation: mmdBtnPulse 2.5s ease-in-out infinite;
        }

        /* Preview area */
        .mmd-preview {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .mmd-video-frame {
          position: relative;
          width: 148px;
          flex-shrink: 0;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          box-shadow: 0 4px 16px rgba(22,163,74,0.15);
        }
        .mmd-video-frame video {
          width: 100%; height: 112px;
          object-fit: cover; display: block;
        }
        .mmd-video-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3));
          pointer-events: none;
        }
        .mmd-video-label {
          position: absolute;
          bottom: 6px; left: 8px;
          font-size: 0.6rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mmd-scan-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(74,222,128,0.8), transparent);
          animation: mmdScanLine 2s ease-in-out infinite;
        }

        /* Mood badges */
        .mmd-badges {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .mmd-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.8rem;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 600;
          transition: transform 0.2s;
          position: relative;
          overflow: hidden;
        }
        .mmd-badge:hover { transform: translateX(3px); }
        .mmd-badge-icon {
          font-size: 1rem;
          line-height: 1;
        }
        .mmd-badge-info { flex: 1; }
        .mmd-badge-label { font-size: 0.62rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.06em; }
        .mmd-badge-value { font-size: 0.78rem; font-weight: 700; margin-top: 1px; }

        .mmd-badge.visual {
          background: linear-gradient(135deg, #fdf2f8, #fce7f3);
          border: 1px solid #f9a8d4;
          color: #9d174d;
        }
        .mmd-badge.audio {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #93c5fd;
          color: #1e3a8a;
        }
        .mmd-badge.combined {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #86efac;
          color: #14532d;
        }

        /* Audio visualizer bars */
        .mmd-audio-bars {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 16px;
          margin-left: auto;
        }
        .mmd-bar {
          width: 3px;
          background: #3b82f6;
          border-radius: 2px;
          animation: mmdAudioBar 0.8s ease-in-out infinite alternate;
        }
        .mmd-bar:nth-child(1) { height: 4px;  animation-delay: 0s; }
        .mmd-bar:nth-child(2) { height: 10px; animation-delay: 0.1s; }
        .mmd-bar:nth-child(3) { height: 6px;  animation-delay: 0.2s; }
        .mmd-bar:nth-child(4) { height: 14px; animation-delay: 0.05s; }
        .mmd-bar:nth-child(5) { height: 8px;  animation-delay: 0.15s; }

        /* No-data state */
        .mmd-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          text-align: center;
          color: #86efac;
        }
        .mmd-empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .mmd-empty-text { font-size: 0.72rem; font-weight: 500; color: #4ade80; }

        /* Keyframes */
        @keyframes mmdGradientFlow {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes mmdPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes mmdBtnPulse {
          0%,100% { box-shadow: 0 4px 16px rgba(22,163,74,0.35); }
          50%      { box-shadow: 0 4px 24px rgba(22,163,74,0.55); }
        }
        @keyframes mmdScanLine {
          0%   { top: 0%;   opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes mmdAudioBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      <div className="mmd-wrap">
        {/* Header */}
        <div className="mmd-header">
          <div className="mmd-title-group">
            <div className="mmd-icon-wrap">
              <Smile />
            </div>
            <div>
              <div className="mmd-title">Mood Detection</div>
              <div className="mmd-subtitle">Multi-modal analysis</div>
            </div>
          </div>
          {(cameraActive || micActive) && (
            <div className="mmd-live-badge">
              <div className="mmd-live-dot" />
              Live
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mmd-controls">
          <button
            className={`mmd-btn ${cameraActive ? "camera-on" : "camera-off"}`}
            onClick={cameraActive ? stopCamera : startCamera}
          >
            {cameraActive ? <Camera /> : <CameraOff />}
            {cameraActive ? "Camera On" : "Enable Camera"}
          </button>
          <button
            className={`mmd-btn ${micActive ? "mic-on" : "mic-off"}`}
            onClick={micActive ? stopMic : startMic}
          >
            {micActive ? <Mic /> : <MicOff />}
            {micActive ? "Mic On" : "Enable Mic"}
          </button>
        </div>

        {/* Preview / Results */}
        {cameraActive || visualMood || audioMood ? (
          <div className="mmd-preview">
            {cameraActive && (
              <div className="mmd-video-frame">
                <video ref={videoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="mmd-video-overlay" />
                <div className="mmd-scan-line" />
                <div className="mmd-video-label">📷 Live Feed</div>
              </div>
            )}

            <div className="mmd-badges">
              {visualMood && (
                <div className="mmd-badge visual">
                  <span className="mmd-badge-icon">
                    {MOOD_EMOJI[visualMood]}
                  </span>
                  <div className="mmd-badge-info">
                    <div className="mmd-badge-label">Visual</div>
                    <div
                      className="mmd-badge-value"
                      style={{ color: MOOD_COLOR[visualMood] }}
                    >
                      {visualMood.charAt(0).toUpperCase() + visualMood.slice(1)}
                    </div>
                  </div>
                </div>
              )}
              {audioMood && (
                <div className="mmd-badge audio">
                  <span className="mmd-badge-icon">
                    {MOOD_EMOJI[audioMood]}
                  </span>
                  <div className="mmd-badge-info">
                    <div className="mmd-badge-label">Voice</div>
                    <div
                      className="mmd-badge-value"
                      style={{ color: MOOD_COLOR[audioMood] }}
                    >
                      {audioMood.charAt(0).toUpperCase() + audioMood.slice(1)}
                    </div>
                  </div>
                  {micActive && (
                    <div className="mmd-audio-bars">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="mmd-bar"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(visualMood || audioMood) && (
                <div className="mmd-badge combined">
                  <span className="mmd-badge-icon">🧠</span>
                  <div className="mmd-badge-info">
                    <div className="mmd-badge-label">Combined</div>
                    <div className="mmd-badge-value">
                      {typingMood.charAt(0).toUpperCase() + typingMood.slice(1)}
                    </div>
                  </div>
                  <Activity
                    size={13}
                    style={{ marginLeft: "auto", opacity: 0.5 }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mmd-empty">
            <div className="mmd-empty-icon">🎭</div>
            <div className="mmd-empty-text">
              Enable camera or mic to begin mood analysis
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MultiModalMoodDetector;
